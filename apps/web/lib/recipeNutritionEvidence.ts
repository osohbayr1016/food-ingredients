/** Shared source-backed nutrition gate for visible recipe pages and search metadata. */
export function hasVerifiedNutrition(metadata: {
  review_status?: unknown;
  nutrition_source?: unknown;
  nutrition_evidence_url?: unknown;
  calories_kcal?: unknown;
  protein_g?: unknown;
  carbs_g?: unknown;
  fat_g?: unknown;
} | null | undefined): boolean {
  if (!metadata || metadata.review_status !== "approved" ||
      typeof metadata.nutrition_source !== "string" ||
      !metadata.nutrition_source.trim() ||
      typeof metadata.nutrition_evidence_url !== "string") return false;
  try {
    const url = new URL(metadata.nutrition_evidence_url);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return false;
  } catch { return false; }
  return [metadata.calories_kcal,metadata.protein_g,
    metadata.carbs_g,metadata.fat_g].some(value =>
    typeof value === "number" && Number.isFinite(value) && value >= 0);
}
