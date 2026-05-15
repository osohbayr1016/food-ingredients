import {
  coalesceIngredientLines,
  parseIngredientLine,
} from "./ingredientLineParse";
import type { RecipePatchPayload } from "./recipePayload";

export const THEMEALDB_IMPORT_SOURCE = "themealdb";

function trimStr(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function ingredientLinesFromMeal(
  meal: Record<string, string | null | undefined>,
): string[] {
  const lines: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = trimStr(meal[`strIngredient${i}`]);
    if (!ing) continue;
    const meas = trimStr(meal[`strMeasure${i}`]);
    lines.push(meas ? `${meas} ${ing}` : ing);
  }
  return coalesceIngredientLines(lines);
}

function stepsFromInstructions(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];
  const byNl = raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byNl.length > 1) return byNl;
  return raw
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter((s) => s.length > 2);
}

function descriptionFromInstructions(instr: string): string {
  const t = instr.replace(/\r\n/g, "\n").trim();
  if (!t) return "";
  const firstPara = t.split(/\n\n+/)[0]?.trim() ?? t;
  return firstPara.length > 800 ? `${firstPara.slice(0, 797)}…` : firstPara;
}

export function mealToRecipePatch(
  meal: Record<string, string | null | undefined> & { idMeal: string; strMeal: string },
  opts: { embedRemoteThumbUrlInTips: boolean },
): RecipePatchPayload {
  const title = trimStr(meal.strMeal) || "Untitled";
  const cuisine = trimStr(meal.strArea) || "International";
  const instr = trimStr(meal.strInstructions);
  const thumb = trimStr(meal.strMealThumb);

  const ingLines = ingredientLinesFromMeal(meal);
  const ingredients: RecipePatchPayload["ingredients"] = [];
  let sort = 0;
  for (const line of ingLines) {
    const row = parseIngredientLine(line, sort);
    if (row) {
      ingredients.push(row);
      sort += 1;
    }
  }

  const stepTexts = stepsFromInstructions(instr);
  const steps: RecipePatchPayload["steps"] = stepTexts.map((description) => ({
    description,
  }));

  let description = descriptionFromInstructions(instr);
  let tips =
    "Recipe data from TheMealDB (themealdb.com). Respect their terms when publishing.";

  if (opts.embedRemoteThumbUrlInTips && thumb)
    tips = `${tips}\nSource image: ${thumb}`;

  if (!description && thumb && opts.embedRemoteThumbUrlInTips)
    description = `Source image: ${thumb}`;

  return {
    recipe: {
      title,
      cuisine,
      prep_time: 0,
      cook_time: 0,
      difficulty: 2,
      description,
      tips,
      serves: 4,
      import_source: THEMEALDB_IMPORT_SOURCE,
      import_external_id: meal.idMeal,
    },
    ingredients,
    steps,
  };
}
