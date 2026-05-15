PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ingredient_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ingredient_canonicals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id TEXT PRIMARY KEY,
  canonical_id TEXT NOT NULL REFERENCES ingredient_canonicals(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  prep_time INTEGER NOT NULL DEFAULT 0,
  cook_time INTEGER NOT NULL DEFAULT 0,
  difficulty INTEGER NOT NULL DEFAULT 2,
  image_r2_key TEXT,
  gallery_r2_keys TEXT,
  description TEXT NOT NULL DEFAULT '',
  tips TEXT,
  serves INTEGER NOT NULL DEFAULT 4,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  import_source TEXT,
  import_external_id TEXT
);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_canonical_id TEXT REFERENCES ingredient_canonicals(id),
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL REFERENCES ingredient_categories(id),
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  description TEXT NOT NULL,
  description_template TEXT,
  timer_seconds INTEGER,
  tip TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

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

CREATE TABLE IF NOT EXISTS saved_recipes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_saved_unique ON saved_recipes(user_id, recipe_id);

CREATE TABLE IF NOT EXISTS cook_history (
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

CREATE INDEX IF NOT EXISTS ix_likes_user ON recipe_likes(user_id);
CREATE INDEX IF NOT EXISTS ix_history_user ON cook_history(user_id);
CREATE INDEX IF NOT EXISTS ix_ingredients_recipe ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS ix_steps_recipe ON steps(recipe_id);
CREATE INDEX IF NOT EXISTS ix_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS ix_recipes_published ON recipes(is_published);
CREATE INDEX IF NOT EXISTS ix_aliases_norm ON ingredient_aliases(normalized);
CREATE INDEX IF NOT EXISTS ix_recipes_pub_cuisine ON recipes(is_published, cuisine);
CREATE UNIQUE INDEX IF NOT EXISTS ix_recipes_import_ext ON recipes(import_source, import_external_id);

CREATE TABLE IF NOT EXISTS user_nutrition_profiles (
  user_id TEXT NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  age_years INTEGER NOT NULL,
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  activity_level TEXT NOT NULL CHECK (activity_level IN (
    'sedentary', 'light', 'moderate', 'active', 'very_active'
  )),
  goal TEXT NOT NULL CHECK (goal IN (
    'maintain', 'cut_mild', 'cut_mod', 'lean_gain', 'gain'
  )),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
