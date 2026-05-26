import type { IngRow, RecipePatchPayload, RecipeRow, StepRow } from "./adminRecipeTypes";
import { INGREDIENT_CATEGORY_IDS } from "./adminRecipeTypes";
import { guessIngredientCategory } from "./parseAiRecipeIngredient";

function asFiniteInt(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function asFiniteDifficulty(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 2;
  return Math.min(3, Math.max(1, Math.round(n)));
}

function normPublished(v: unknown): boolean | number {
  if (v === true || v === 1 || v === "1") return true;
  if (v === false || v === 0 || v === "0") return false;
  return true;
}

function normCategory(id: unknown, name: string): string {
  const s = typeof id === "string" ? id.trim() : "";
  if (s && INGREDIENT_CATEGORY_IDS.has(s)) return s;
  return guessIngredientCategory(name);
}

function normGalleryKeys(raw: unknown): string | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const keys = raw.map((x) => String(x).trim()).filter(Boolean);
    return keys.length ? JSON.stringify(keys) : null;
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

function recipeTimeField(
  raw: Record<string, unknown>,
  flatKey: "prep_time" | "cook_time",
  camelKey: "prepTime" | "cookTime",
  nestedKey: "preparation_minutes" | "cook_minutes",
): number {
  const time =
    raw.time && typeof raw.time === "object"
      ? (raw.time as Record<string, unknown>)
      : null;
  return asFiniteInt(raw[flatKey] ?? raw[camelKey] ?? time?.[nestedKey], 0);
}

function normCuisine(raw: Record<string, unknown>): string {
  const direct = String(raw.cuisine ?? raw.strArea ?? "").trim();
  if (direct) return direct;
  const origin = raw.origin;
  if (typeof origin === "string" && origin.trim()) {
    return origin.trim().split(/\s+/)[0] || "General";
  }
  return "General";
}

function normTips(raw: Record<string, unknown>): string | null {
  if (raw.tips != null) {
    const s = String(raw.tips).trim();
    return s || null;
  }
  if (Array.isArray(raw.notes)) {
    const s = raw.notes.map((n) => String(n).trim()).filter(Boolean).join("\n");
    return s || null;
  }
  return null;
}

function pickTitle(raw: Record<string, unknown>): string {
  const meta =
    raw.metadata && typeof raw.metadata === "object"
      ? (raw.metadata as Record<string, unknown>)
      : null;
  return (
    String(
      raw.title ??
        raw.name ??
        raw.strMeal ??
        raw.recipe_title ??
        raw.recipe_name ??
        raw.recipeName ??
        raw.dish_name ??
        raw.dishName ??
        meta?.title ??
        meta?.name ??
        "",
    ).trim() || "Untitled"
  );
}

function normalizeListItems(raw: unknown, kind: "ingredient" | "step"): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") {
      const text = item.trim();
      return kind === "ingredient" ? { name: text } : { description: text };
    }
    return item;
  });
}

function normRecipe(raw: Record<string, unknown>): RecipeRow {
  const title = pickTitle(raw);
  const description = String(raw.description ?? raw.summary ?? "").trim();
  return {
    title,
    cuisine: normCuisine(raw),
    prep_time: recipeTimeField(raw, "prep_time", "prepTime", "preparation_minutes"),
    cook_time: recipeTimeField(raw, "cook_time", "cookTime", "cook_minutes"),
    difficulty: asFiniteDifficulty(raw.difficulty),
    image_r2_key:
      raw.image_r2_key === null ||
      raw.image_r2_key === undefined ||
      String(raw.image_r2_key).trim() === ""
        ? null
        : String(raw.image_r2_key).trim(),
    gallery_r2_keys: normGalleryKeys(raw.gallery_r2_keys),
    description: description || title,
    tips: normTips(raw),
    serves: Math.max(
      1,
      asFiniteInt(raw.serves ?? raw.base_servings ?? raw.servings, 4),
    ),
    is_published: normPublished(raw.is_published),
  };
}

function normIng(raw: Record<string, unknown>, idx: number): IngRow {
  const name = String(raw.name ?? raw.ingredient ?? "").trim() || `Ingredient ${idx + 1}`;
  const q = Number(raw.quantity ?? raw.amount);
  const quantity = Number.isFinite(q) && q > 0 ? q : 1;
  return {
    name,
    quantity,
    unit: String(raw.unit ?? "").trim(),
    category_id: normCategory(raw.category_id, name),
    ingredient_canonical_id:
      raw.ingredient_canonical_id == null
        ? null
        : String(raw.ingredient_canonical_id),
    note: raw.note == null ? null : String(raw.note),
    sort_order: idx,
  };
}

function normStep(raw: Record<string, unknown>): StepRow {
  const description = String(
    raw.description ?? raw.content ?? raw.text ?? raw.instruction ?? "",
  ).trim();
  return {
    description,
    description_template:
      raw.description_template == null ? null : String(raw.description_template),
    timer_seconds:
      raw.timer_seconds == null ? null : asFiniteInt(raw.timer_seconds, 0),
    tip: raw.tip == null ? null : String(raw.tip),
  };
}

function stepsFromInstructions(text: string): Record<string, string>[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean)
    .map((description) => ({ description }));
}

function unwrapRecipeEnvelope(input: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["payload", "data", "result", "recipe_data"]) {
    const inner = input[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return input;
}

function unwrapRecipeRoot(input: unknown): Record<string, unknown> {
  if (Array.isArray(input)) {
    const first = input.find((x) => x && typeof x === "object" && !Array.isArray(x));
    if (first) return first as Record<string, unknown>;
    return {};
  }
  if (!input || typeof input !== "object") return {};
  const obj = input as Record<string, unknown>;
  const recipes = obj.recipes;
  if (Array.isArray(recipes)) {
    const first = recipes.find((x) => x && typeof x === "object" && !Array.isArray(x));
    if (first) return first as Record<string, unknown>;
  }
  return unwrapRecipeEnvelope(obj);
}

/** Normalize common JSON export shapes into `{ recipe, ingredients, steps }`. */
export function coerceRecipeJsonShape(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const root = unwrapRecipeRoot(input);
  const rec = root.recipe;
  const topIngredients = root.ingredients;
  const topSteps = root.steps;

  if (rec && typeof rec === "object") {
    const recipeObj = rec as Record<string, unknown>;
    const nestedIngredients = recipeObj.ingredients;
    const nestedSteps = recipeObj.steps;

    if (Array.isArray(nestedIngredients) || Array.isArray(nestedSteps)) {
      const recipeMeta = Object.fromEntries(
        Object.entries(recipeObj).filter(([k]) => k !== "ingredients" && k !== "steps"),
      ) as Record<string, unknown>;
      let steps = Array.isArray(nestedSteps) ? nestedSteps : topSteps;
      if (!Array.isArray(steps) || steps.length === 0) {
        const instr =
          recipeObj.instructions ??
          recipeObj.strInstructions ??
          root.instructions;
        if (typeof instr === "string" && instr.trim()) {
          steps = stepsFromInstructions(instr);
        }
      }
      return {
        recipe: recipeMeta,
        ingredients: normalizeListItems(
          Array.isArray(nestedIngredients) ? nestedIngredients : topIngredients,
          "ingredient",
        ),
        steps: normalizeListItems(steps, "step"),
        ...(Array.isArray(root.tag_ids) ? { tag_ids: root.tag_ids } : {}),
      };
    }

    if (Array.isArray(topIngredients) && Array.isArray(topSteps)) {
      return root;
    }
  }

  const ingredients = normalizeListItems(topIngredients, "ingredient");
  let steps = normalizeListItems(topSteps, "step");

  if ((!steps.length || !Array.isArray(topSteps)) && ingredients.length) {
    const instr =
      root.instructions ?? root.strInstructions ?? root.instruction;
    if (typeof instr === "string" && instr.trim()) {
      steps = normalizeListItems(stepsFromInstructions(instr), "step");
    }
  }

  if (ingredients.length && steps.length) {
    const recipeMeta = Object.fromEntries(
      Object.entries(root).filter(([k]) => k !== "ingredients" && k !== "steps" && k !== "tag_ids"),
    ) as Record<string, unknown>;
    return {
      recipe: recipeMeta,
      ingredients,
      steps,
      ...(Array.isArray(root.tag_ids) ? { tag_ids: root.tag_ids } : {}),
    };
  }

  return root;
}

function stripOuterFence(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im;
  const m = t.match(fence);
  if (m) return m[1].trim();
  return t;
}

export function parseRecipeJsonFile(
  raw: string,
): { ok: true; payload: RecipePatchPayload } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "empty_input" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripOuterFence(t));
  } catch {
    return { ok: false, error: "json_parse_error" };
  }

  const root =
    parsed && typeof parsed === "object"
      ? coerceRecipeJsonShape(parsed as Record<string, unknown>)
      : null;
  if (!root) return { ok: false, error: "json_not_object" };

  return normalizeRecipePatchPayload(root);
}

export function normalizeRecipePatchPayload(
  input: Record<string, unknown>,
): { ok: true; payload: RecipePatchPayload } | { ok: false; error: string } {
  const rec = input.recipe;
  if (!rec || typeof rec !== "object") return { ok: false, error: "json_missing_recipe" };
  const recipe = normRecipe(rec as Record<string, unknown>);

  const ingRaw = input.ingredients;
  if (!Array.isArray(ingRaw)) return { ok: false, error: "json_bad_ingredients" };
  const ingredients = ingRaw.map((row, i) =>
    normIng((typeof row === "object" && row ? row : {}) as Record<string, unknown>, i),
  );

  const stepRaw = input.steps;
  if (!Array.isArray(stepRaw)) return { ok: false, error: "json_bad_steps" };
  const steps = stepRaw.map((row) =>
    normStep((typeof row === "object" && row ? row : {}) as Record<string, unknown>),
  );

  const tagRaw = input.tag_ids;
  let tag_ids: string[] | undefined;
  if (Array.isArray(tagRaw)) {
    tag_ids = tagRaw.map((t) => String(t)).filter(Boolean);
  }

  if (!recipe.title.trim()) return { ok: false, error: "empty_title" };
  if (!ingredients.length) return { ok: false, error: "no_ingredients" };
  if (!steps.length) return { ok: false, error: "no_steps" };
  if (steps.some((s) => !s.description.trim()))
    return { ok: false, error: "empty_step_description" };

  return { ok: true, payload: { recipe, ingredients, steps, tag_ids } };
}
