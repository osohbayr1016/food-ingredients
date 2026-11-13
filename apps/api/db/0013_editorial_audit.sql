-- Reviewer attestation and separate publication date preserve the original creation date.
CREATE TABLE IF NOT EXISTS recipe_review_events (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved','published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_recipe_review_events_recipe ON recipe_review_events(recipe_id,created_at DESC);

CREATE TABLE IF NOT EXISTS recipe_publication_dates (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_recipe_publication_dates_time ON recipe_publication_dates(published_at DESC);
-- Safe idempotent backfill of existing public recipes.
INSERT OR IGNORE INTO recipe_publication_dates(recipe_id,published_at)
 SELECT id,created_at FROM recipes WHERE is_published=1;
