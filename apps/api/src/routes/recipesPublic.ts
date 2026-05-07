import { Hono } from "hono";
import type { Env } from "../bindings";

export const recipes = new Hono<{ Bindings: Env }>();

recipes.get("/recipes", async (c) => {
  const cuisine = c.req.query("cuisine");
  const difficulty = c.req.query("difficulty");
  const maxCook = c.req.query("max_cook_time");
  const tag = c.req.query("tag");
  const query = c.req.query("q")?.trim().toLowerCase();

  const where = ["r.is_published = 1"];
  const params: (string | number)[] = [];
  if (cuisine) {
    where.push("r.cuisine = ?");
    params.push(cuisine);
  }
  if (difficulty) {
    where.push("r.difficulty = ?");
    params.push(Number(difficulty));
  }
  if (maxCook) {
    where.push("r.cook_time <= ?");
    params.push(Number(maxCook));
  }
  if (query) {
    where.push(
      `(lower(r.title) LIKE ? OR r.id IN (SELECT recipe_id FROM ingredients WHERE lower(name) LIKE ?))`,
    );
    params.push(`%${query}%`, `%${query}%`);
  }

  let sql = "SELECT DISTINCT r.* FROM recipes r";
  if (tag) {
    sql += ` JOIN recipe_tags rt ON rt.recipe_id = r.id
             JOIN tags tg ON tg.id = rt.tag_id AND tg.name = ?`;
    params.unshift(tag);
  }
  sql += ` WHERE ${where.join(" AND ")} ORDER BY r.created_at DESC`;
  const stmt = c.env.DB.prepare(sql).bind(...params);
  const { results } = await stmt.all();
  return c.json({ recipes: results ?? [] });
});

recipes.get("/recipes/:id", async (c) => {
  const id = c.req.param("id");
  const recipe = await c.env.DB.prepare(
    "SELECT * FROM recipes WHERE id = ? AND is_published = 1",
  )
    .bind(id)
    .first();
  if (!recipe) return c.json({ error: "not_found" }, 404);

  const ingredients = await c.env.DB.prepare(
    `SELECT i.*, c.name AS category_name FROM ingredients i
     JOIN ingredient_categories c ON c.id = i.category_id
     WHERE i.recipe_id = ? ORDER BY i.sort_order ASC, c.name ASC`,
  )
    .bind(id)
    .all();

  const steps = await c.env.DB.prepare(
    "SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_order ASC",
  )
    .bind(id)
    .all();

  const tags = await c.env.DB.prepare(
    `SELECT t.id, t.name FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id
     WHERE rt.recipe_id = ?`,
  )
    .bind(id)
    .all();

  return c.json({
    recipe,
    ingredients: ingredients.results ?? [],
    steps: steps.results ?? [],
    tags: tags.results ?? [],
  });
});
