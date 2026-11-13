import { Hono } from "hono";
import type { Env } from "../../bindings";
import { insertRecipe, applyRecipePatch } from "../../lib/applyRecipePatch";
import { metadataFromRow } from "../../lib/recipeMetadata";
import type { RecipePatchPayload } from "../../lib/recipePayload";
import { validateRecipePatch } from "../../lib/recipeValidation";

export const recipesAdmin = new Hono<{ Bindings: Env }>();

recipesAdmin.get("/recipes", async (c) => {
  const page = Number(c.req.query("page") || 1);
  const pageSize = Number(c.req.query("page_size") || 30);
  const status = c.req.query("status") || "all";
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return c.json({ error: "invalid_pagination" }, 400);
  }
  if (!["all", "draft", "published", "pending", "ready"].includes(status)) {
    return c.json({ error: "invalid_status" }, 400);
  }
  const where: string[] = [];
  if (status === "draft") where.push("r.is_published=0");
  if (status === "published") where.push("r.is_published=1");
  if (status === "pending") {
    where.push("r.is_published=0 AND COALESCE(m.review_status,'pending') <> 'approved'");
  }
  if (status === "ready") {
    where.push("r.is_published=0 AND m.review_status='approved' AND COALESCE(m.license_name,'') <> ''");
  }
  const { results } = await c.env.DB.prepare(`SELECT r.id,r.title,r.cuisine,
      r.is_published,r.created_at,m.review_status,m.license_name
    FROM recipes r LEFT JOIN recipe_metadata m ON m.recipe_id=r.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY datetime(r.created_at) DESC,r.id ASC LIMIT ? OFFSET ?`)
    .bind(pageSize + 1, (page - 1) * pageSize).all();
  const rows = results ?? [];
  return c.json({
    recipes: rows.slice(0,pageSize),
    pagination: {page,page_size:pageSize,has_more:rows.length > pageSize},
  });
});

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
  const rawMetadata = await c.env.DB.prepare("SELECT * FROM recipe_metadata WHERE recipe_id = ?").bind(id).first<Record<string, unknown>>();
  return c.json({
    recipe,
    metadata: metadataFromRow(rawMetadata),
    ingredients: ingredients.results ?? [],
    steps: steps.results ?? [],
    tag_ids,
  });
});

recipesAdmin.post("/recipes", async (c) => {
  const patch = await c.req.json().catch(() => null) as RecipePatchPayload | null;
  const errors = validateRecipePatch(patch);
  if (!patch || errors.length) return c.json({ error: "invalid_recipe", details: errors }, 400);
  const id = crypto.randomUUID();
  await insertRecipe(c.env.DB, id, patch);
  return c.json({ id });
});

recipesAdmin.patch("/recipes/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json().catch(() => null) as RecipePatchPayload | null;
  const errors = validateRecipePatch(patch);
  if (!patch || errors.length) return c.json({ error: "invalid_recipe", details: errors }, 400);
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
