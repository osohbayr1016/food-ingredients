import { Hono } from "hono";
import type { Env } from "../bindings";

/** Published recipe counts per tag — for filters and Discover. */
export const recipeTagsPublic = new Hono<{ Bindings: Env }>();

recipeTagsPublic.get("/tags", async (c) => {
  const sql = `
    SELECT t.id AS id, t.name AS name,
           (SELECT COUNT(*) FROM recipe_tags rt2
             JOIN recipes r2 ON r2.id = rt2.recipe_id AND r2.is_published = 1
             WHERE rt2.tag_id = t.id) AS recipe_count
    FROM tags t
    ORDER BY t.name COLLATE NOCASE ASC
  `;
  const { results } = await c.env.DB.prepare(sql).all<{ id: string; name: string; recipe_count: number }>();
  return c.json({ tags: results ?? [] });
});
