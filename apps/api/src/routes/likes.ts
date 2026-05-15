import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";

export const likes = new Hono<{ Bindings: Env }>();

likes.get("/likes", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ liked: [] });
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, l.liked_at FROM recipe_likes l
     JOIN recipes r ON r.id = l.recipe_id
     WHERE l.user_id = ? AND r.is_published = 1
     ORDER BY datetime(l.liked_at) DESC`,
  )
    .bind(jwt.sub)
    .all();
  return c.json({ liked: results ?? [] });
});

likes.post("/likes", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "auth_required" }, 401);
  const body = await c.req.json().catch(() => null) as { recipe_id?: string } | null;
  const recipeId = body?.recipe_id?.trim();
  if (!recipeId) return c.json({ error: "recipe_id_required" }, 400);
  const exists = await c.env.DB.prepare(
    "SELECT id FROM recipes WHERE id = ? AND is_published = 1",
  )
    .bind(recipeId)
    .first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?,?)`,
  )
    .bind(jwt.sub, recipeId)
    .run();
  return c.json({ ok: true });
});

likes.delete("/likes/:recipeId", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "auth_required" }, 401);
  const recipeId = c.req.param("recipeId");
  await c.env.DB.prepare(
    "DELETE FROM recipe_likes WHERE user_id = ? AND recipe_id = ?",
  )
    .bind(jwt.sub, recipeId)
    .run();
  return c.json({ ok: true });
});

likes.get("/likes/:recipeId", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ liked: false });
  const recipeId = c.req.param("recipeId");
  const row = await c.env.DB.prepare(
    "SELECT 1 AS ok FROM recipe_likes WHERE user_id = ? AND recipe_id = ?",
  )
    .bind(jwt.sub, recipeId)
    .first();
  return c.json({ liked: !!row });
});
