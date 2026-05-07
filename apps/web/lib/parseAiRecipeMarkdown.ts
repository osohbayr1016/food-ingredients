import type { RecipePatchPayload, RecipeRow, StepRow } from "./adminRecipeTypes";
import { coalesceIngredientLines, parseIngredientLine } from "./parseAiRecipeIngredient";
import {
  applyMetaFromLines,
  linesBeforeFirstIngredientsSection,
} from "./parseAiRecipeMeta";
import {
  classifyPlainSectionHeading,
  expandInlineIngredientsHeading,
  extractTitleAndBody,
  headerToSection,
  parseStepLinesToSteps,
  preambleRowsToSkipForDescription,
  type Sec,
} from "./parseAiRecipeMarkdownHelpers";

export function parseMarkdownRecipe(
  text: string,
):
  | { ok: true; payload: RecipePatchPayload }
  | { ok: false; error: string } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[\u200B-\u200D\uFEFF]/g, ""));
  const { title: title0, body } = extractTitleAndBody(lines);
  const bodyExpanded = body.flatMap(expandInlineIngredientsHeading);
  const titleRaw = title0.trim() || "Imported recipe";

  const ingLines: string[] = [];
  const stepLines: string[] = [];
  const descParts: string[] = [];
  const tipParts: string[] = [];
  const metaRecipe: Partial<RecipeRow> = {
    prep_time: 0,
    cook_time: 0,
    difficulty: 2,
    serves: 4,
    cuisine: "General",
  };

  let section: Sec = "skip";
  const preamble: string[] = [];
  let seenHeader = false;

  for (const line of bodyExpanded) {
    const h2 = line.match(/^##\s*(.+)\s*$/);
    if (h2) {
      seenHeader = true;
      section = headerToSection(h2[1]);
      continue;
    }

    const plainSec = classifyPlainSectionHeading(line);
    if (plainSec !== "skip") {
      seenHeader = true;
      section = plainSec;
      continue;
    }

    if (!seenHeader) {
      preamble.push(line);
      continue;
    }

    if (section === "ingredients") ingLines.push(line);
    else if (section === "steps") stepLines.push(line);
    else if (section === "description") descParts.push(line);
    else if (section === "tips") tipParts.push(line);
  }

  applyMetaFromLines(linesBeforeFirstIngredientsSection(bodyExpanded), metaRecipe);

  const skipDesc = preambleRowsToSkipForDescription(preamble);
  for (let i = 0; i < preamble.length; i++) {
    if (skipDesc.has(i)) continue;
    const pl = preamble[i];
    const t = pl.trim();
    if (t && !/^\*\*/.test(t) && !/^[-*•]/.test(t)) descParts.push(pl);
  }

  const mergedIng = coalesceIngredientLines(ingLines);
  let ingredients = mergedIng
    .map((ln, i) => parseIngredientLine(ln, i))
    .filter((x): x is NonNullable<typeof x> => x != null);

  if (!ingredients.length && preamble.length) {
    const fromPreamble = coalesceIngredientLines(preamble)
      .map((ln, i) => parseIngredientLine(ln, i))
      .filter((x): x is NonNullable<typeof x> => x != null);
    if (fromPreamble.length) {
      ingredients = fromPreamble.map((row, i) => ({
        ...row,
        sort_order: i,
      }));
    }
  }

  const steps: StepRow[] = parseStepLinesToSteps(stepLines);

  const description = descParts
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const tipsJoined = tipParts.join("\n").trim() || null;

  const recipe: RecipeRow = {
    title: titleRaw,
    cuisine: String(metaRecipe.cuisine || "General"),
    prep_time: metaRecipe.prep_time ?? 0,
    cook_time: metaRecipe.cook_time ?? 0,
    difficulty: metaRecipe.difficulty ?? 2,
    description: description || titleRaw || "—",
    tips: tipsJoined,
    serves: metaRecipe.serves ?? 4,
    is_published: true,
    image_r2_key: null,
    gallery_r2_keys: null,
  };

  if (!ingredients.length) return { ok: false, error: "no_ingredients" };
  if (!steps.length) return { ok: false, error: "no_steps" };

  return { ok: true, payload: { recipe, ingredients, steps } };
}
