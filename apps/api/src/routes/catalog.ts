import { Hono } from "hono";
import type { Env } from "../bindings";

export const catalog = new Hono<{ Bindings: Env }>();

catalog.get("/ingredient-catalog", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id AS canonical_id, name FROM ingredient_canonicals ORDER BY name COLLATE NOCASE ASC`,
  ).all();
  return c.json({ canonicals: results ?? [] });
});
