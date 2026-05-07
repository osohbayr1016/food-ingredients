import { Hono } from "hono";
import type { Env } from "../../bindings";
import { insertRecipe, applyRecipePatch } from "../../lib/applyRecipePatch";
import type { RecipePatchPayload } from "../../lib/recipePayload";

export const recipesAdmin = new Hono<{ Bindings: Env }>();

recipesAdmin.get("/recipes", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM recipes ORDER BY datetime(created_at) DESC`,
  ).all();
  return c.json({ recipes: results ?? [] });
});

function badPatch(b: RecipePatchPayload | null) {
  if (!b || typeof b.recipe !== "object") return true;
  if (!Array.isArray(b.ingredients) || !Array.isArray(b.steps)) return true;
  return false;
}

recipesAdmin.get("/recipes/:id", async (c) => {
  const id = c.req.param("id");
  const recipe = await c.env.DB.prepare("SELECT * FROM recipes WHERE id = ?")
    .bind(id)
    .first();
  if (!recipe) return c.json({ error: "not_found" }, 404);
  const ingredients = await c.env.DB.prepare(
    `SELECT i.*, c.name AS category_name FROM ingredients i
     JOIN ingredient_categories c ON c.id = i.category_id
     WHERE i.recipe_id = ? ORDER BY i.sort_order ASC`,
  ).bind(id).all();
  const steps = await c.env.DB.prepare(
    "SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_order ASC",
  ).bind(id).all();
  const tags = await c.env.DB.prepare(
    `SELECT t.id FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.recipe_id = ?`,
  ).bind(id).all();
  const tag_rows = tags.results ?? [];
  const tag_ids = tag_rows
    .map((t) => String((t as { id?: string }).id ?? ""))
    .filter(Boolean);
  return c.json({
    recipe,
    ingredients: ingredients.results ?? [],
    steps: steps.results ?? [],
    tag_ids,
  });
});

recipesAdmin.post("/recipes", async (c) => {
  const patch = await c.req.json().catch(() => null) as RecipePatchPayload | null;
  if (badPatch(patch) || !patch) return c.json({ error: "bad_body" }, 400);
  const id = crypto.randomUUID();
  await insertRecipe(c.env.DB, id, patch);
  return c.json({ id });
});

recipesAdmin.patch("/recipes/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json().catch(() => null) as RecipePatchPayload | null;
  if (badPatch(patch) || !patch) return c.json({ error: "bad_body" }, 400);
  await applyRecipePatch(c.env.DB, id, patch);
  return c.json({ ok: true });
});

recipesAdmin.delete("/recipes/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM recipes WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

recipesAdmin.get("/ingredient-categories", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM ingredient_categories ORDER BY name ASC`,
  ).all();
  return c.json({ categories: results ?? [] });
});
