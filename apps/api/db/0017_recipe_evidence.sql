-- Evidence references are separate from a manual review flag.
-- Legacy recipes remain readable but don't qualify as source-backed safety matches.
CREATE TABLE IF NOT EXISTS recipe_evidence (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  allergen_evidence_url TEXT,
  nutrition_evidence_url TEXT,
  review_notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
