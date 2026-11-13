import type { Env } from "../bindings";

/** Shared guard between the admin queue and the daily scheduler. */
export const READY_TO_PUBLISH_SQL = `r.is_published=0 AND m.review_status='approved'
  AND trim(COALESCE(m.license_name,'')) <> ''
  AND (r.prep_time + r.cook_time) > 0
  AND length(trim(r.description)) >= 15
  AND (SELECT COUNT(*) FROM ingredients i WHERE i.recipe_id=r.id) >= 2
  AND (SELECT COUNT(*) FROM steps s WHERE s.recipe_id=r.id) >= 2`;

/** Publish at most one *already approved and explicitly queued* recipe per cron day. */
export async function publishOneApprovedRecipe(env: Env): Promise<string> {
  if (env.AUTO_DAILY_PUBLISH !== "true") return "disabled";
  const candidate = await env.DB.prepare(`SELECT r.id FROM recipe_publication_queue q
    JOIN recipes r ON r.id=q.recipe_id
    JOIN recipe_metadata m ON m.recipe_id=r.id
    WHERE q.status='queued' AND ${READY_TO_PUBLISH_SQL}
    ORDER BY q.queued_at ASC,r.id ASC LIMIT 1`).first<{id:string}>();
  if (!candidate?.id) return "no_approved_queued_recipe";

  const dayUtc = new Date().toISOString().slice(0,10);
  // D1.batch executes transactionally. Every attempt must reserve the same
  // UTC date before publishing; a second candidate cannot publish that day.
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO recipe_publication_days
      (day_utc,recipe_id) VALUES (?,?)`).bind(dayUtc,candidate.id),
    env.DB.prepare(`UPDATE recipes SET is_published=1 WHERE id=? AND is_published=0
      AND EXISTS (SELECT 1 FROM recipe_publication_days d
        WHERE d.day_utc=? AND d.recipe_id=? AND d.published_at IS NULL)
      AND EXISTS (
        SELECT 1 FROM recipe_metadata m JOIN recipe_publication_queue q ON q.recipe_id=?
        JOIN recipes r ON r.id=?
        WHERE m.recipe_id=r.id AND q.status='queued' AND ${READY_TO_PUBLISH_SQL}
      )`).bind(candidate.id,dayUtc,candidate.id,candidate.id,candidate.id),
    env.DB.prepare(`UPDATE recipe_publication_queue SET
      status='published',published_at=datetime('now')
      WHERE recipe_id=? AND status='queued'
      AND EXISTS (SELECT 1 FROM recipes WHERE id=? AND is_published=1)
      AND EXISTS (SELECT 1 FROM recipe_publication_days
        WHERE day_utc=? AND recipe_id=?)`)
      .bind(candidate.id,candidate.id,dayUtc,candidate.id),
    env.DB.prepare(`UPDATE recipe_publication_days SET published_at=datetime('now')
      WHERE day_utc=? AND recipe_id=? AND published_at IS NULL
      AND EXISTS (SELECT 1 FROM recipe_publication_queue
        WHERE recipe_id=? AND status='published')`)
      .bind(dayUtc,candidate.id,candidate.id),
  ]);

  const status = await env.DB.prepare(
    "SELECT status FROM recipe_publication_queue WHERE recipe_id=?"
  ).bind(candidate.id).first<{status:string}>();
  const dayRow = await env.DB.prepare(
    "SELECT recipe_id,published_at FROM recipe_publication_days WHERE day_utc=?"
  ).bind(dayUtc).first<{recipe_id:string|null;published_at:string|null}>();
  return status?.status === "published" && dayRow?.recipe_id === candidate.id && dayRow?.published_at
    ? `published:${candidate.id}` : "skipped_already_released_or_stale_review";
}
