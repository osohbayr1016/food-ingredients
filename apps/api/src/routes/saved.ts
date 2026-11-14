import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";
import { readBoundedJson } from "../lib/boundedJson";
import { parseRecipeId, parseCookHistoryInput } from "../lib/recipeInteractionInput";

export const saved = new Hono<{ Bindings: Env }>();

saved.get("/saved", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ saved: [] });
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, s.saved_at FROM saved_recipes s
     JOIN recipes r ON r.id = s.recipe_id
     WHERE s.user_id = ? AND r.is_published = 1
     ORDER BY datetime(s.saved_at) DESC`,
  )
    .bind(jwt.sub)
    .all();
  return c.json({ saved: results ?? [] });
});

saved.post("/saved", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "auth_required" }, 401);
  const decoded = await readBoundedJson(c.req.raw.body, 8 * 1024);
  if (!decoded.ok) return c.json({error:decoded.error},decoded.error==="payload_too_large"?413:400);
  const body = decoded.value as { recipe_id?: string } | null;
  const recipeId = parseRecipeId(body?.recipe_id);
  if (!recipeId) return c.json({ error: "recipe_id_required" }, 400);
  const exists = await c.env.DB.prepare(
    "SELECT id FROM recipes WHERE id = ? AND is_published = 1",
  )
    .bind(recipeId)
    .first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO saved_recipes (id, user_id, recipe_id) VALUES (?,?,?)`,
  )
    .bind(id, jwt.sub, recipeId)
    .run();
  return c.json({ ok: true });
});

saved.delete("/saved/:recipeId", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "auth_required" }, 401);
  const recipeId = c.req.param("recipeId");
  await c.env.DB.prepare(
    "DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?",
  )
    .bind(jwt.sub, recipeId)
    .run();
  return c.json({ ok: true });
});

saved.get("/history", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ history: [] });
  const { results } = await c.env.DB.prepare(
    `SELECT h.*, r.title, r.cuisine, r.cook_time, r.image_r2_key
     FROM cook_history h
     JOIN recipes r ON r.id = h.recipe_id
     WHERE h.user_id = ?
     ORDER BY datetime(h.cooked_at) DESC`,
  )
    .bind(jwt.sub)
    .all();
  return c.json({ history: results ?? [] });
});

saved.post("/history", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "auth_required" }, 401);
  const decoded = await readBoundedJson(c.req.raw.body, 8 * 1024);
  if (!decoded.ok) return c.json({error:decoded.error},decoded.error==="payload_too_large"?413:400);
  const input = parseCookHistoryInput(decoded.value);
  if (!input) return c.json({ error: "invalid_cooking_history" }, 400);
  const { recipe_id: recipeId, rating, personal_note: note } = input;
  const exists = await c.env.DB.prepare("SELECT id FROM recipes WHERE id = ?")
    .bind(recipeId)
    .first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO cook_history (id, user_id, recipe_id, rating, personal_note)
     VALUES (?,?,?,?,?)`,
  )
    .bind(id, jwt.sub, recipeId, rating, note)
    .run();
  return c.json({ ok: true, id });
});
