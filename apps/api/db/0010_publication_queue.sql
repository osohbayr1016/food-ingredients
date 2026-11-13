-- Only explicitly queued, editorially approved recipes may be auto-published.
CREATE TABLE IF NOT EXISTS recipe_publication_queue (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','published')),
  queued_by TEXT NOT NULL,
  queued_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_publication_queue_status_time
  ON recipe_publication_queue(status,queued_at);
