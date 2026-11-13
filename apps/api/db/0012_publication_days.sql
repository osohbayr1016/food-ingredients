-- One UTC-day reservation prevents multiple cron/retry deliveries on the same day.
CREATE TABLE IF NOT EXISTS recipe_publication_days (
  day_utc TEXT PRIMARY KEY,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_recipe_publication_days_published ON recipe_publication_days(published_at);
