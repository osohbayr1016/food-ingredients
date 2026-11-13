import type { Env } from "../bindings";
import { insertRecipe } from "./applyRecipePatch";
import { findRecipeByImport, findRecipesByNormalizedTitle } from "./recipeImportDedupe";
import { lookupMealById } from "./theMealDbClient";
import { THEMEALDB_IMPORT_SOURCE, mealToRecipePatch } from "./theMealDbToPatch";
import { validateRecipePatch } from "./recipeValidation";

/**
 * Import one candidate as an UNPUBLISHED draft, never as a verified recipe.
 * The free TheMealDB key is for development/testing; do not enable in public
 * production without a permitted production key and rights review.
 */
export async function importDailyCandidate(env: Env): Promise<string> {
  if (env.AUTO_IMPORT_ENABLED !== "true") return "disabled";
  const key = env.THEMEALDB_API_KEY;
  if (!key || key === "1") return "production_api_key_required";

  // A bounded retry avoids losing the whole day when a random ID already exists.
  // No new draft is guaranteed if the source returns only duplicates/invalid data.
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/${encodeURIComponent(key)}/random.php`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) },
    );
    if (!response.ok) throw new Error(`TheMealDB fetch failed: ${response.status}`);
    const json = (await response.json()) as {
      meals?: Array<{ idMeal?: string; strMeal?: string }> | null;
    };
    const id = String(json.meals?.[0]?.idMeal ?? "").trim();
    if (!/^\d{1,20}$/.test(id)) continue;
    const meal = await lookupMealById(id, key);
    if (!meal) continue;
    const patch = mealToRecipePatch(meal, { embedRemoteThumbUrlInTips: false });
    if (!patch.recipe.title.trim() || patch.ingredients.length < 2 || patch.steps.length < 2) continue;

    const [alreadyImported, titleDuplicates] = await Promise.all([
      findRecipeByImport(env.DB, THEMEALDB_IMPORT_SOURCE, id),
      findRecipesByNormalizedTitle(env.DB, patch.recipe.title),
    ]);
    if (alreadyImported || titleDuplicates.length) continue;

    patch.recipe.is_published = false;
    patch.recipe.prep_time = 0; // unknown means unknown, never fabricate minutes.
    patch.recipe.cook_time = 0;
    patch.metadata = {
      source_url: "https://www.themealdb.com/",
      license_name: null, // review must establish source/media rights
      video_url: String(meal.strYoutube ?? "").trim() || null,
      review_status: "pending",
      allergen_status: "unknown",
      allergens: [],
    };
    patch.recipe.tips = [patch.recipe.tips,
      "AUTO IMPORT DRAFT: Verify attribution, media rights, timings, ingredient quantities, safety and allergens before publishing."].filter(Boolean).join("\n");
    if (validateRecipePatch(patch).length) continue;
    const recipeId = crypto.randomUUID();
    await insertRecipe(env.DB, recipeId, patch);
    return `draft_created:${recipeId}`;
  }
  return "no_new_valid_candidate";
}
