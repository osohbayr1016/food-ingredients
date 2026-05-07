import { Hono } from "hono";
import type { Env } from "../bindings";

function devId(c: { req: { header: (k: string) => string | undefined } }) {
  return c.req.header("X-Device-Id")?.trim() || null;
}

export const saved = new Hono<{ Bindings: Env }>();

saved.get("/saved", async (c) => {
  const did = devId(c);
  if (!did) return c.json({ saved: [] });
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, s.saved_at FROM saved_recipes s
     JOIN recipes r ON r.id = s.recipe_id
     WHERE s.device_id = ? AND r.is_published = 1
     ORDER BY datetime(s.saved_at) DESC`,
  )
    .bind(did)
    .all();
  return c.json({ saved: results ?? [] });
});

saved.post("/saved", async (c) => {
  const did = devId(c);
  if (!did) return c.json({ error: "device_required" }, 400);
  const body = await c.req.json().catch(() => null) as { recipe_id?: string } | null;
  const recipeId = body?.recipe_id?.trim();
  if (!recipeId) return c.json({ error: "recipe_id_required" }, 400);
  const exists = await c.env.DB.prepare(
    "SELECT id FROM recipes WHERE id = ? AND is_published = 1",
  )
    .bind(recipeId)
    .first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO saved_recipes (id, device_id, recipe_id) VALUES (?,?,?)`,
  )
    .bind(id, did, recipeId)
    .run();
  return c.json({ ok: true });
});

saved.delete("/saved/:recipeId", async (c) => {
  const did = devId(c);
  if (!did) return c.json({ error: "device_required" }, 400);
  const recipeId = c.req.param("recipeId");
  await c.env.DB.prepare(
    "DELETE FROM saved_recipes WHERE device_id = ? AND recipe_id = ?",
  )
    .bind(did, recipeId)
    .run();
  return c.json({ ok: true });
});

saved.get("/history", async (c) => {
  const did = devId(c);
  if (!did) return c.json({ history: [] });
  const { results } = await c.env.DB.prepare(
    `SELECT h.*, r.title, r.cuisine, r.cook_time, r.image_r2_key
     FROM cook_history h
     JOIN recipes r ON r.id = h.recipe_id
     WHERE h.device_id = ?
     ORDER BY datetime(h.cooked_at) DESC`,
  )
    .bind(did)
    .all();
  return c.json({ history: results ?? [] });
});

saved.post("/history", async (c) => {
  const did = devId(c);
  if (!did) return c.json({ error: "device_required" }, 400);
  const body = await c.req.json().catch(() => null) as {
    recipe_id?: string;
    rating?: number;
    personal_note?: string;
  } | null;
  const recipeId = body?.recipe_id?.trim();
  if (!recipeId) return c.json({ error: "recipe_id_required" }, 400);
  const exists = await c.env.DB.prepare("SELECT id FROM recipes WHERE id = ?")
    .bind(recipeId)
    .first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  const rating = body?.rating;
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return c.json({ error: "bad_rating" }, 400);
  }
  const id = crypto.randomUUID();
  const note = body?.personal_note?.slice(0, 2000) ?? null;
  await c.env.DB.prepare(
    `INSERT INTO cook_history (id, device_id, recipe_id, rating, personal_note)
     VALUES (?,?,?,?,?)`,
  )
    .bind(id, did, recipeId, rating ?? null, note)
    .run();
  return c.json({ ok: true, id });
});
