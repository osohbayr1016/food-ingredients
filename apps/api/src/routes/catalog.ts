import { Hono } from "hono";
import type { Env } from "../bindings";

export const catalog = new Hono<{ Bindings: Env }>();

catalog.get("/ingredient-catalog", async (c) => {
  const filtered = await c.env.DB.prepare(
    `
    SELECT DISTINCT ic.id AS canonical_id, ic.name
    FROM ingredient_canonicals ic
    WHERE EXISTS (
      SELECT 1 FROM ingredients ing
      INNER JOIN recipes rec ON rec.id = ing.recipe_id AND rec.is_published = 1
      WHERE ing.ingredient_canonical_id = ic.id
    )
    ORDER BY ic.name COLLATE NOCASE ASC
    `,
  ).all();
  let rows = filtered.results ?? [];
  if (!rows.length) {
    const all = await c.env.DB.prepare(
      `SELECT id AS canonical_id, name FROM ingredient_canonicals ORDER BY name COLLATE NOCASE ASC`,
    ).all();
    rows = all.results ?? [];
  }
  return c.json({ canonicals: rows });
});
