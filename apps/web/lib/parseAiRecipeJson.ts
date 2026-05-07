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

function normRecipe(raw: Record<string, unknown>): RecipeRow {
  const title = String(raw.title ?? "").trim() || "Untitled";
  const description = String(raw.description ?? "").trim();
  return {
    title,
    cuisine: String(raw.cuisine ?? "General").trim() || "General",
    prep_time: asFiniteInt(raw.prep_time, 0),
    cook_time: asFiniteInt(raw.cook_time, 0),
    difficulty: asFiniteDifficulty(raw.difficulty),
    image_r2_key:
      raw.image_r2_key === null ||
      raw.image_r2_key === undefined ||
      String(raw.image_r2_key).trim() === ""
        ? null
        : String(raw.image_r2_key).trim(),
    gallery_r2_keys: normGalleryKeys(raw.gallery_r2_keys),
    description: description || title,
    tips:
      raw.tips === null || raw.tips === undefined
        ? null
        : String(raw.tips).trim() || null,
    serves: Math.max(1, asFiniteInt(raw.serves, 4)),
    is_published: normPublished(raw.is_published),
  };
}

function normIng(raw: Record<string, unknown>, idx: number): IngRow {
  const name = String(raw.name ?? "").trim() || `Ingredient ${idx + 1}`;
  const q = Number(raw.quantity);
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
  return {
    description: String(raw.description ?? "").trim(),
    description_template:
      raw.description_template == null ? null : String(raw.description_template),
    timer_seconds:
      raw.timer_seconds == null ? null : asFiniteInt(raw.timer_seconds, 0),
    tip: raw.tip == null ? null : String(raw.tip),
  };
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
