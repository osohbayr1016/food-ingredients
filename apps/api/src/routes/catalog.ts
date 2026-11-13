import { Hono } from "hono";
import type { Env } from "../bindings";
import { recipeFtsMatch } from "../lib/recipeSearch";

export const catalog = new Hono<{ Bindings: Env }>();

const SEARCH_LIMIT = 50;

catalog.get("/ingredient-catalog", async c => {
  const q=(c.req.query("q") ?? "").trim().slice(0,100);
  const pubFilter=`EXISTS (
    SELECT 1 FROM ingredients ing JOIN recipes rec
      ON rec.id=ing.recipe_id AND rec.is_published=1
    WHERE ing.ingredient_canonical_id=ic.id
  )`;
  if (q) {
    const match=recipeFtsMatch(q);
    if (!match) return c.json({canonicals:[]});
    const base=`SELECT DISTINCT ic.id AS canonical_id,ic.name
      FROM ingredient_search_fts f
      JOIN ingredient_canonicals ic ON ic.id=f.canonical_id
      WHERE ingredient_search_fts MATCH ?`;
    const withPublic=await c.env.DB.prepare(
      `${base} AND ${pubFilter} ORDER BY ic.name COLLATE NOCASE LIMIT ${SEARCH_LIMIT}`
    ).bind(match).all();
    const rows=withPublic.results ?? [];
    if (rows.length) return c.json({canonicals:rows});
    const fallback=await c.env.DB.prepare(
      `${base} ORDER BY ic.name COLLATE NOCASE LIMIT ${SEARCH_LIMIT}`
    ).bind(match).all();
    return c.json({canonicals:fallback.results ?? []});
  }
  const filtered=await c.env.DB.prepare(`SELECT DISTINCT ic.id AS canonical_id,ic.name
    FROM ingredient_canonicals ic WHERE ${pubFilter}
    ORDER BY ic.name COLLATE NOCASE LIMIT ${SEARCH_LIMIT}`).all();
  if (filtered.results?.length) return c.json({canonicals:filtered.results});
  const all=await c.env.DB.prepare(`SELECT id AS canonical_id,name FROM ingredient_canonicals
    ORDER BY name COLLATE NOCASE LIMIT ${SEARCH_LIMIT}`).all();
  return c.json({canonicals:all.results ?? []});
});
