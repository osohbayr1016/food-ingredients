-- Revocable JWT session versions, safe for legacy tokens issued with version zero.
CREATE TABLE IF NOT EXISTS user_session_versions (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 0 CHECK(version>=0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
