-- Auth: users, recipe_likes; saved + history keyed by user_id (drops device rows).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recipe_likes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  liked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS ix_likes_user ON recipe_likes(user_id);

CREATE TABLE IF NOT EXISTS saved_recipes_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX ix_saved_user_recipe_new ON saved_recipes_new(user_id, recipe_id);

DROP TABLE IF EXISTS saved_recipes;
ALTER TABLE saved_recipes_new RENAME TO saved_recipes;
CREATE UNIQUE INDEX IF NOT EXISTS ix_saved_unique ON saved_recipes(user_id, recipe_id);

CREATE TABLE IF NOT EXISTS cook_history_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  cooked_at TEXT NOT NULL DEFAULT (datetime('now')),
  rating INTEGER,
  personal_note TEXT,
  CONSTRAINT rating_range CHECK (
    rating IS NULL OR (rating >= 1 AND rating <= 5)
  )
);

CREATE INDEX ix_history_user_new ON cook_history_new(user_id);

DROP TABLE IF EXISTS cook_history;
ALTER TABLE cook_history_new RENAME TO cook_history;
CREATE INDEX IF NOT EXISTS ix_history_user ON cook_history(user_id);

INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'admin',
  '100000$7318d2aa3de1db72c415b354fa64f5c5$5ef3faa9a70fe7950642d217f7ead912169e0acaaa3410394a14da15ef846045',
  'admin'
);
