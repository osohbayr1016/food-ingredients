import { Hono } from "hono";
import type { Env } from "../bindings";
import { ALLERGEN_CODES, metadataFromRow } from "../lib/recipeMetadata";
import { expandRecipeSearch } from "../lib/recipeSearch";

export const recipes = new Hono<{ Bindings: Env }>();

recipes.get("/recipes", async (c) => {
  const cuisine = c.req.query("cuisine");
  const difficulty = c.req.query("difficulty");
  const maxCook = c.req.query("max_cook_time");
  const tag = c.req.query("tag");
  const query = c.req.query("q")?.trim().toLowerCase().slice(0, 100);
  const page = Number(c.req.query("page") || 1);
  const pageSize = Number(c.req.query("page_size") || 36);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return c.json({ error: "invalid_pagination" }, 400);
  }
  const excludedRaw = c.req.query("exclude_allergens")?.trim();
  const excluded = excludedRaw ? [...new Set(excludedRaw.split(",").filter(Boolean))] : [];
  if (excluded.some(code => !ALLERGEN_CODES.includes(code as typeof ALLERGEN_CODES[number]))) return c.json({ error: "invalid_allergen" }, 400);
  const maxKcalRaw = c.req.query("max_calories");
  const minProteinRaw = c.req.query("min_protein");

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
    const maxMinutes = Number(maxCook);
    if (Number.isSafeInteger(maxMinutes) && maxMinutes > 0 && maxMinutes <= 1440) {
      // Zero-valued imported times mean unknown, not "instant".
      where.push("(r.prep_time + r.cook_time) > 0 AND (r.prep_time + r.cook_time) <= ?");
      params.push(maxMinutes);
    }
  }
  // Allergens: only ingredient-reviewed recipes qualify, never unreviewed recipes.
  if (excluded.length) {
    const placeholders = excluded.map(() => "?").join(",");
    where.push(`EXISTS (SELECT 1 FROM recipe_metadata m WHERE m.recipe_id=r.id
      AND m.review_status='approved' AND m.allergen_status='ingredients_reviewed'
      AND NOT EXISTS (SELECT 1 FROM json_each(m.allergens_json) a WHERE a.value IN (${placeholders})))`);
    params.push(...excluded);
  }
  if (maxKcalRaw) {
    const maxKcal = Number(maxKcalRaw);
    if (!Number.isFinite(maxKcal) || maxKcal <= 0 || maxKcal > 10000) return c.json({ error: "invalid_max_calories" }, 400);
    where.push("EXISTS (SELECT 1 FROM recipe_metadata m WHERE m.recipe_id=r.id AND m.review_status='approved' AND m.nutrition_source IS NOT NULL AND m.calories_kcal <= ?)");
    params.push(maxKcal);
  }
  if (minProteinRaw) {
    const minProtein = Number(minProteinRaw);
    if (!Number.isFinite(minProtein) || minProtein < 0 || minProtein > 1000) return c.json({ error: "invalid_min_protein" }, 400);
    where.push("EXISTS (SELECT 1 FROM recipe_metadata m WHERE m.recipe_id=r.id AND m.review_status='approved' AND m.nutrition_source IS NOT NULL AND m.protein_g >= ?)");
    params.push(minProtein);
  }
  if (query) {
    const terms = expandRecipeSearch(query);
    const matches = `(instr(lower(r.title), ?) > 0 OR EXISTS (
      SELECT 1 FROM ingredients ing
      LEFT JOIN ingredient_canonicals canon ON canon.id=ing.ingredient_canonical_id
      LEFT JOIN ingredient_aliases alias ON alias.canonical_id=ing.ingredient_canonical_id
      WHERE ing.recipe_id=r.id AND (
        instr(lower(ing.name), ?) > 0 OR instr(lower(canon.name), ?) > 0
        OR instr(alias.normalized, ?) > 0
      )
    ))`;
    where.push(`(${terms.map(() => matches).join(" OR ")})`);
    for (const term of terms) params.push(term, term, term, term);
  }

  let sql = "SELECT DISTINCT r.* FROM recipes r";
  if (tag) {
    sql += ` JOIN recipe_tags rt ON rt.recipe_id = r.id
             JOIN tags tg ON tg.id = rt.tag_id AND tg.name = ?`;
    params.unshift(tag);
  }
  sql += ` WHERE ${where.join(" AND ")} ORDER BY r.created_at DESC, r.id ASC LIMIT ? OFFSET ?`;
  const stmt = c.env.DB.prepare(sql).bind(...params, pageSize + 1, (page - 1) * pageSize);
  const { results } = await stmt.all();
  const rows = results ?? [];
  return c.json({ recipes: rows.slice(0, pageSize), pagination: {
    page, page_size: pageSize, has_more: rows.length > pageSize,
  } });
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

  const metadataRow = await c.env.DB.prepare("SELECT * FROM recipe_metadata WHERE recipe_id = ?")
    .bind(id).first<Record<string, unknown>>();

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
    metadata: metadataFromRow(metadataRow),
  });
});
