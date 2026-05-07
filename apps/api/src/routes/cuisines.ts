import { Hono } from "hono";
import type { Env } from "../bindings";

export const cuisines = new Hono<{ Bindings: Env }>();

cuisines.get("/cuisines", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT cuisine AS name, COUNT(*) AS recipe_count
     FROM recipes WHERE is_published = 1 GROUP BY cuisine ORDER BY cuisine ASC`,
  ).all();
  return c.json({ cuisines: results ?? [] });
});
