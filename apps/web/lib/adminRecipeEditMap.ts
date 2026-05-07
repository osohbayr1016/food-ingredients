import type { AdminRecipeDetail } from "./adminRecipeFetch";
import type { IngRow, RecipePatchPayload, RecipeRow, StepRow } from "./adminRecipeTypes";

function publishedFromDb(v: unknown): boolean {
  return v === true || v === 1;
}

export function adminDetailToPayload(detail: AdminRecipeDetail): RecipePatchPayload {
  const r = detail.recipe;
  const recipe: RecipeRow = {
    title: String(r.title ?? ""),
    cuisine: String(r.cuisine ?? ""),
    prep_time: Number(r.prep_time ?? 0),
    cook_time: Number(r.cook_time ?? 0),
    difficulty: Number(r.difficulty ?? 2),
    image_r2_key:
      r.image_r2_key != null && String(r.image_r2_key).trim()
        ? String(r.image_r2_key)
        : null,
    gallery_r2_keys:
      r.gallery_r2_keys != null && String(r.gallery_r2_keys).trim()
        ? String(r.gallery_r2_keys)
        : null,
    description: String(r.description ?? ""),
    tips: r.tips != null && String(r.tips).trim() ? String(r.tips) : null,
    serves: Number(r.serves ?? 4),
    is_published: publishedFromDb(r.is_published),
  };

  const ingredients: IngRow[] = (detail.ingredients ?? []).map((row, i) => ({
    id: String(row.id ?? ""),
    ingredient_canonical_id:
      row.ingredient_canonical_id != null
        ? String(row.ingredient_canonical_id)
        : null,
    name: String(row.name ?? ""),
    quantity: Number(row.quantity ?? 1),
    unit: String(row.unit ?? ""),
    category_id: String(row.category_id ?? "cat-extra"),
    note: row.note != null && String(row.note).trim() ? String(row.note) : null,
    sort_order: Number(row.sort_order ?? i),
  }));

  const steps: StepRow[] = (detail.steps ?? []).map((row) => ({
    id: String(row.id ?? ""),
    description: String(row.description ?? ""),
    description_template:
      row.description_template != null
        ? String(row.description_template)
        : null,
    timer_seconds:
      row.timer_seconds != null && row.timer_seconds !== ""
        ? Number(row.timer_seconds)
        : null,
    tip: row.tip != null && String(row.tip).trim() ? String(row.tip) : null,
  }));

  return {
    recipe,
    ingredients,
    steps,
    tag_ids: detail.tag_ids?.length ? [...detail.tag_ids] : [],
  };
}
