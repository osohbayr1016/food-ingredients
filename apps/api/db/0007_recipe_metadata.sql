-- Structured editorial, allergy and per-serving nutrition metadata.
-- Safe to re-run and does not change legacy recipe rows.
CREATE TABLE IF NOT EXISTS recipe_metadata (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  source_url TEXT,
  license_name TEXT,
  video_url TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved')),
  allergen_status TEXT NOT NULL DEFAULT 'unknown' CHECK (allergen_status IN ('unknown','ingredients_reviewed')),
  allergens_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(allergens_json)),
  nutrition_source TEXT,
  calories_kcal REAL CHECK (calories_kcal IS NULL OR (calories_kcal >= 0 AND calories_kcal <= 10000)),
  protein_g REAL CHECK (protein_g IS NULL OR (protein_g >= 0 AND protein_g <= 1000)),
  carbs_g REAL CHECK (carbs_g IS NULL OR (carbs_g >= 0 AND carbs_g <= 1000)),
  fat_g REAL CHECK (fat_g IS NULL OR (fat_g >= 0 AND fat_g <= 1000)),
  reviewed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_recipe_metadata_review ON recipe_metadata(review_status);
CREATE INDEX IF NOT EXISTS ix_recipe_metadata_allergen ON recipe_metadata(allergen_status);
