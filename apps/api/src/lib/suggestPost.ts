import { buildIngredientPreview } from "./suggestIngredientPreview";
import { mergedNormNames, parseSuggestInput } from "./suggestBodyParse";
import { enrichPreviewWithPantryQty } from "./pantryQuantity";
import {
  loadIngredientsByRecipe,
  loadRecipeMetaById,
  resolveCanonicalIds,
  scoreMatchingRecipes,
} from "./suggestData";
import { hydratePantryLines } from "./suggestHydrate";

export async function runSuggestQuery(
  db: D1Database,
  body: unknown,
): Promise<unknown> {
  const parsed = parseSuggestInput(body);
  if (!parsed) {
    return { results: [] };
  }
  let { legacyNames, pantry, filters } = parsed;
  pantry = await hydratePantryLines(db, pantry);
  const names = mergedNormNames(legacyNames, pantry);
  const fromPantryCanon = [
    ...new Set(
      pantry.map((p) => p.canonical_id).filter((id): id is string => !!id),
    ),
  ];
  const canonIdsFromNames = await resolveCanonicalIds(db, names);
  const canonIds = [...new Set([...canonIdsFromNames, ...fromPantryCanon])];
  if (!names.length && !canonIds.length) {
    return { results: [] };
  }
  const rows = await scoreMatchingRecipes(db, names, canonIds, filters);
  const recipeIds = rows.map((r) => r.recipe_id);
  const ingMap = await loadIngredientsByRecipe(db, recipeIds);
  const metaMap = await loadRecipeMetaById(db, recipeIds);
  const nameSet = new Set(names);
  const canonSet = new Set(canonIds);

  const out = rows.map(({ recipe_id: recipeId }) => {
    const ings = ingMap.get(recipeId) ?? [];
    const { matchedCount: matchedCnt, preview: basePreview } =
      buildIngredientPreview(ings, nameSet, canonSet);
    const { preview: ingredients_preview, pantry_shortfall } =
      enrichPreviewWithPantryQty(ings, basePreview, pantry);
    const totalIngredients = ings.length;
    const pct = totalIngredients ? matchedCnt / totalIngredients : 0;
    const titleRow = rows.find((r) => r.recipe_id === recipeId)!;
    const m = metaMap.get(recipeId);
    return {
      recipe_id: recipeId,
      title: m?.title ?? titleRow.title,
      cuisine: m?.cuisine ?? "",
      description: m?.description ?? "",
      prep_time: m?.prep_time ?? 0,
      cook_time: m?.cook_time ?? 0,
      difficulty: m?.difficulty ?? 2,
      serves: m?.serves ?? 4,
      image_r2_key: m?.image_r2_key ?? null,
      match_ratio: pct,
      matched_count: matchedCnt,
      total_ingredients: totalIngredients,
      ingredients_preview,
      pantry_shortfall,
    };
  });

  return { results: out };
}
