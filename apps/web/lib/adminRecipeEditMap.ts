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

  const meta = detail.metadata ?? {};
  const metadata = {
    source_url: typeof meta.source_url === "string" ? meta.source_url : null,
    license_name: typeof meta.license_name === "string" ? meta.license_name : null,
    video_url: typeof meta.video_url === "string" ? meta.video_url : null,
    review_status: meta.review_status === "approved" ? "approved" as const : "pending" as const,
    allergen_status: meta.allergen_status === "ingredients_reviewed" ? "ingredients_reviewed" as const : "unknown" as const,
    allergens: Array.isArray(meta.allergens) ? meta.allergens.filter((v): v is string => typeof v === "string") : [],
    nutrition_source: typeof meta.nutrition_source === "string" ? meta.nutrition_source : null,
    allergen_evidence_url: typeof meta.allergen_evidence_url === "string" ? meta.allergen_evidence_url : null,
    nutrition_evidence_url: typeof meta.nutrition_evidence_url === "string" ? meta.nutrition_evidence_url : null,
    review_notes: typeof meta.review_notes === "string" ? meta.review_notes : null,
    calories_kcal: typeof meta.calories_kcal === "number" ? meta.calories_kcal : null,
    protein_g: typeof meta.protein_g === "number" ? meta.protein_g : null,
    carbs_g: typeof meta.carbs_g === "number" ? meta.carbs_g : null,
    fat_g: typeof meta.fat_g === "number" ? meta.fat_g : null,
  };
  return {
    recipe,
    metadata,
    ingredients,
    steps,
    tag_ids: detail.tag_ids?.length ? [...detail.tag_ids] : [],
  };
}
