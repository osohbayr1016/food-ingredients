-- Per-account pantry snapshot. Changes require an exact revision match.
-- No personal pantry data is stored for guests.
CREATE TABLE IF NOT EXISTS user_pantry_snapshots (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(items_json)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
