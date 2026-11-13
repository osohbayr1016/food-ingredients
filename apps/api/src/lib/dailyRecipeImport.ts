import type { Env } from "../bindings";
import { insertRecipe } from "./applyRecipePatch";
import { findRecipeByImport, findRecipesByNormalizedTitle } from "./recipeImportDedupe";
import { lookupMealById } from "./theMealDbClient";
import { THEMEALDB_IMPORT_SOURCE, mealToRecipePatch } from "./theMealDbToPatch";

/**
 * Import one candidate as an UNPUBLISHED draft, never as a verified recipe.
 * The free TheMealDB key is for development/testing; do not enable in public
 * production without a permitted production key and rights review.
 */
export async function importDailyCandidate(env: Env): Promise<string> {
  if (env.AUTO_IMPORT_ENABLED !== "true") return "disabled";
  const key = env.THEMEALDB_API_KEY;
  if (!key || key === "1") return "production_api_key_required";

  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/${encodeURIComponent(key)}/random.php`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`TheMealDB fetch failed: ${response.status}`);

  const json = (await response.json()) as {
    meals?: Array<{ idMeal?: string; strMeal?: string }> | null;
  };
  const id = String(json.meals?.[0]?.idMeal ?? "").trim();
  if (!/^\d{1,20}$/.test(id)) return "invalid_source_id";

  // Lookup uses the repo's existing converter; production support for a
  // custom API key must be threaded into the lookup client before enabling.
  const meal = await lookupMealById(id, key);
  if (!meal) return "missing_source_record";
  const patch = mealToRecipePatch(meal, { embedRemoteThumbUrlInTips: false });

  if (
    !patch.recipe.title.trim() ||
    patch.ingredients.length < 2 ||
    patch.steps.length < 2 ||
    patch.steps.some((s) => !s.description.trim())
  ) return "invalid_recipe";

  const [alreadyImported, titleDuplicates] = await Promise.all([
    findRecipeByImport(env.DB, THEMEALDB_IMPORT_SOURCE, id),
    findRecipesByNormalizedTitle(env.DB, patch.recipe.title),
  ]);
  if (alreadyImported || titleDuplicates.length > 0) return "duplicate";

  patch.recipe.is_published = false;
  patch.recipe.prep_time = 0;
  patch.recipe.cook_time = 0;
  patch.recipe.tips = [patch.recipe.tips, "AUTO IMPORT DRAFT: Verify license, attribution, recipe instructions, safety, allergen information and actual timings before publishing."].filter(Boolean).join("\n");

  // Do not copy external artwork before confirming reuse permissions.
  // Draft records do not appear in public search.
  const recipeId = crypto.randomUUID();
  await insertRecipe(env.DB, recipeId, patch);
  return `draft_created:${recipeId}`;
}
