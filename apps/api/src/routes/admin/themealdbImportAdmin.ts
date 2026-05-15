import { Hono } from "hono";
import type { Env } from "../../bindings";
import { insertRecipe } from "../../lib/applyRecipePatch";
import { fetchRemoteImageToR2 } from "../../lib/fetchUrlToR2";
import {
  findRecipeByImport,
  findRecipesByNormalizedTitle,
} from "../../lib/recipeImportDedupe";
import { lookupMealById, searchMeals } from "../../lib/theMealDbClient";
import {
  THEMEALDB_IMPORT_SOURCE,
  mealToRecipePatch,
} from "../../lib/theMealDbToPatch";

export const themealdbImportAdmin = new Hono<{ Bindings: Env }>();

themealdbImportAdmin.get("/import/themealdb/search", async (c) => {
  const q = c.req.query("q")?.trim() ?? "";
  if (!q) return c.json({ meals: [] });
  try {
    const meals = await searchMeals(q);
    return c.json({
      meals: meals.map((m) => ({
        idMeal: m.idMeal,
        strMeal: m.strMeal,
        strMealThumb: m.strMealThumb ?? "",
      })),
    });
  } catch {
    return c.json({ error: "themealdb_fetch_failed" }, 502);
  }
});

themealdbImportAdmin.get("/import/themealdb/preview", async (c) => {
  const id = c.req.query("id")?.trim() ?? "";
  if (!id) return c.json({ error: "missing_id" }, 400);
  let meal;
  try {
    meal = await lookupMealById(id);
  } catch {
    return c.json({ error: "themealdb_fetch_failed" }, 502);
  }
  if (!meal) return c.json({ error: "not_found" }, 404);

  const patch = mealToRecipePatch(meal, { embedRemoteThumbUrlInTips: true });
  try {
    const existingByImport = await findRecipeByImport(
      c.env.DB,
      THEMEALDB_IMPORT_SOURCE,
      id,
    );
    const titleRows = await findRecipesByNormalizedTitle(
      c.env.DB,
      patch.recipe.title,
    );
    const titleMatches = titleRows.filter((r) => r.id !== existingByImport);

    return c.json({
      patch,
      dedupe: {
        conflict: existingByImport ? "external" : null,
        existing_recipe_id: existingByImport,
        title_matches: titleMatches.map((r) => ({ id: r.id, title: r.title })),
      },
    });
  } catch (e) {
    console.error("themealdb/preview dedupe", e);
    return c.json({
      patch,
      dedupe: {
        conflict: null,
        existing_recipe_id: null,
        title_matches: [],
        dedupe_unavailable: true,
      },
    });
  }
});

themealdbImportAdmin.post("/import/themealdb/commit", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    idMeal?: string;
    publish?: boolean;
    skip_image?: boolean;
  } | null;
  const idMeal = body?.idMeal?.trim() ?? "";
  if (!idMeal) return c.json({ error: "missing_idMeal" }, 400);
  const publish = body?.publish === true;
  const skipImage = body?.skip_image === true;

  let meal;
  try {
    meal = await lookupMealById(idMeal);
  } catch {
    return c.json({ error: "themealdb_fetch_failed" }, 502);
  }
  if (!meal) return c.json({ error: "not_found" }, 404);

  const existing = await findRecipeByImport(
    c.env.DB,
    THEMEALDB_IMPORT_SOURCE,
    idMeal,
  );
  if (existing)
    return c.json({ error: "duplicate_external", recipe_id: existing }, 409);

  const patch = mealToRecipePatch(meal, { embedRemoteThumbUrlInTips: false });
  patch.recipe.is_published = publish;

  const recipeId = crypto.randomUUID();
  await insertRecipe(c.env.DB, recipeId, patch);

  const thumb = String(meal.strMealThumb ?? "").trim();
  if (!skipImage && thumb.startsWith("https://")) {
    const key = await fetchRemoteImageToR2(c.env, recipeId, thumb);
    if (key) {
      await c.env.DB.prepare("UPDATE recipes SET image_r2_key = ? WHERE id = ?")
        .bind(key, recipeId)
        .run();
    }
  }

  return c.json({ id: recipeId });
});
