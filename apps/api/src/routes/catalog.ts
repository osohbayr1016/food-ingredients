import { Hono } from "hono";
import type { Env } from "../bindings";

export const catalog = new Hono<{ Bindings: Env }>();

const SEARCH_LIMIT = 50;

function likePattern(q: string): string {
  const esc = q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  return `%${esc}%`;
}

catalog.get("/ingredient-catalog", async (c) => {
  const rawQ = (c.req.query("q") ?? "").trim();
  const hasQ = rawQ.length > 0;
  const likePat = hasQ ? likePattern(rawQ) : null;

  const pubFilter = `
    EXISTS (
      SELECT 1 FROM ingredients ing
      INNER JOIN recipes rec ON rec.id = ing.recipe_id AND rec.is_published = 1
      WHERE ing.ingredient_canonical_id = ic.id
    )`;
  const nameCond = hasQ ? ` AND ic.name LIKE ? ESCAPE '\\' ` : "";

  const pubSql = `
    SELECT DISTINCT ic.id AS canonical_id, ic.name
    FROM ingredient_canonicals ic
    WHERE ${pubFilter} ${nameCond}
    ORDER BY ic.name COLLATE NOCASE ASC
    ${hasQ ? `LIMIT ${SEARCH_LIMIT}` : ""}
    `;
  const filtered =
    hasQ && likePat
      ? await c.env.DB.prepare(pubSql).bind(likePat).all()
      : await c.env.DB.prepare(pubSql).all();

  let rows = filtered.results ?? [];
  if (!rows.length && !hasQ) {
    const all = await c.env.DB.prepare(
      `SELECT id AS canonical_id, name FROM ingredient_canonicals ORDER BY name COLLATE NOCASE ASC`,
    ).all();
    rows = all.results ?? [];
  }
  if (!rows.length && hasQ) {
    const fb = await c.env.DB.prepare(
      `
      SELECT id AS canonical_id, name FROM ingredient_canonicals ic
      WHERE ic.name LIKE ? ESCAPE '\\'
      ORDER BY ic.name COLLATE NOCASE ASC
      LIMIT ${SEARCH_LIMIT}
      `,
    )
      .bind(likePat!)
      .all();
    rows = fb.results ?? [];
  }
  return c.json({ canonicals: rows });
});
