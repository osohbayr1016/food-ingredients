import type { RecipeMetadata } from "./recipePayload";

export const ALLERGEN_CODES = [
  "milk", "egg", "fish", "shellfish", "tree_nuts",
  "peanuts", "wheat", "soy", "sesame",
] as const;
type AllergenCode = typeof ALLERGEN_CODES[number];
const VALID_CODES = new Set<string>(ALLERGEN_CODES);

export function validateRecipeMetadata(m: RecipeMetadata | undefined): string[] {
  if (!m) return [];
  const errors: string[] = [];
  const validUrl = (v: string | null | undefined) => {
    if (!v) return true;
    if (v.length > 1000) return false;
    try {
      const u = new URL(v);
      return u.protocol === "https:" && Boolean(u.hostname);
    } catch { return false; }
  };
  if (!validUrl(m.source_url)) errors.push("metadata_invalid_source_url");
  if (!validUrl(m.video_url)) errors.push("metadata_invalid_video_url");
  if (m.license_name != null && m.license_name.length > 120) errors.push("metadata_invalid_license");
  if (m.nutrition_source != null && m.nutrition_source.length > 300) errors.push("metadata_invalid_nutrition_source");
  if (m.review_status != null && !["pending", "approved"].includes(m.review_status)) errors.push("metadata_invalid_review_status");
  if (m.allergen_status != null && !["unknown", "ingredients_reviewed"].includes(m.allergen_status)) errors.push("metadata_invalid_allergen_status");
  if (m.allergens != null && (!Array.isArray(m.allergens) || m.allergens.length > ALLERGEN_CODES.length ||
       m.allergens.some(x => typeof x !== "string" || !VALID_CODES.has(x)))) errors.push("metadata_invalid_allergens");
  for (const name of ["calories_kcal", "protein_g", "carbs_g", "fat_g"] as const) {
    const v = m[name];
    const max = name === "calories_kcal" ? 10000 : 1000;
    if (v != null && (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max)) {
      errors.push(`metadata_invalid_${name}`);
    }
  }
  if ([m.calories_kcal, m.protein_g, m.carbs_g, m.fat_g].some(v => v != null) &&
      !m.nutrition_source?.trim()) errors.push("metadata_requires_nutrition_source");
  return errors;
}

export function normalizedRecipeMetadata(m: RecipeMetadata): Required<RecipeMetadata> {
  return {
    source_url: m.source_url?.trim() || null,
    license_name: m.license_name?.trim() || null,
    video_url: m.video_url?.trim() || null,
    review_status: m.review_status === "approved" ? "approved" : "pending",
    allergen_status: m.allergen_status === "ingredients_reviewed" ? "ingredients_reviewed" : "unknown",
    allergens: [...new Set((m.allergens ?? []).filter((x): x is AllergenCode => VALID_CODES.has(x)))],
    nutrition_source: m.nutrition_source?.trim() || null,
    calories_kcal: m.calories_kcal ?? null,
    protein_g: m.protein_g ?? null,
    carbs_g: m.carbs_g ?? null,
    fat_g: m.fat_g ?? null,
  };
}

export function metadataUpsert(db: D1Database, recipeId: string, raw: RecipeMetadata): D1PreparedStatement {
  const m = normalizedRecipeMetadata(raw);
  return db.prepare(`INSERT INTO recipe_metadata (
    recipe_id, source_url, license_name, video_url, review_status,
    allergen_status, allergens_json, nutrition_source,
    calories_kcal, protein_g, carbs_g, fat_g, reviewed_at, updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ? = 'approved' THEN datetime('now') ELSE NULL END,datetime('now'))
  ON CONFLICT(recipe_id) DO UPDATE SET
    source_url=excluded.source_url,license_name=excluded.license_name,
    video_url=excluded.video_url,review_status=excluded.review_status,
    allergen_status=excluded.allergen_status,allergens_json=excluded.allergens_json,
    nutrition_source=excluded.nutrition_source,calories_kcal=excluded.calories_kcal,
    protein_g=excluded.protein_g,carbs_g=excluded.carbs_g,
    reviewed_at=CASE WHEN excluded.review_status='approved' THEN COALESCE(recipe_metadata.reviewed_at,datetime('now')) ELSE NULL END,
    updated_at=datetime('now')`).bind(
    recipeId,m.source_url,m.license_name,m.video_url,m.review_status,
    m.allergen_status,JSON.stringify(m.allergens),m.nutrition_source,
    m.calories_kcal,m.protein_g,m.carbs_g,m.fat_g,m.review_status
  );
}
