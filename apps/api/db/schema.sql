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

-- Hashed, short-lived authentication request counters (no raw IP addresses).
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(key_hash, action, window_start)
);
CREATE INDEX IF NOT EXISTS ix_auth_rate_limits_expiry ON auth_rate_limits(window_start);

-- Indexes for paginated recipe lists and canonical pantry matches.
CREATE INDEX IF NOT EXISTS ix_recipes_pub_created ON recipes(is_published, created_at DESC, id ASC);
CREATE INDEX IF NOT EXISTS ix_ingredients_canonical_recipe ON ingredients(ingredient_canonical_id, recipe_id);
CREATE INDEX IF NOT EXISTS ix_ingredients_lower_name ON ingredients(lower(name));

-- Approved daily recipe publication queue.
CREATE TABLE IF NOT EXISTS recipe_publication_queue (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','published')),
  queued_by TEXT NOT NULL,
  queued_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_publication_queue_status_time
  ON recipe_publication_queue(status,queued_at);

-- Unicode61 FTS5 powers Mongolian Cyrillic case-insensitive recipe search.
-- Stored index is rebuilt from existing data and automatically refreshed.
CREATE VIRTUAL TABLE IF NOT EXISTS recipe_search_fts USING fts5(
  recipe_id UNINDEXED, title, ingredient_terms,
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS recipes_search_insert AFTER INSERT ON recipes BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id=NEW.id;
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id=NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS recipes_search_update AFTER UPDATE ON recipes BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id=NEW.id;
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id=NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS recipes_search_delete AFTER DELETE ON recipes BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id=OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS ingredients_search_insert AFTER INSERT ON ingredients BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id=NEW.recipe_id;
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id=NEW.recipe_id;
END;

CREATE TRIGGER IF NOT EXISTS ingredients_search_update AFTER UPDATE ON ingredients BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id=OLD.recipe_id;
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id=OLD.recipe_id;
  DELETE FROM recipe_search_fts WHERE recipe_id=NEW.recipe_id;
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id=NEW.recipe_id;
END;

CREATE TRIGGER IF NOT EXISTS ingredients_search_delete AFTER DELETE ON ingredients BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id=OLD.recipe_id;
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id=OLD.recipe_id;
END;

CREATE TRIGGER IF NOT EXISTS ingredient_canonicals_search_insert AFTER INSERT ON ingredient_canonicals BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS ingredient_canonicals_search_update AFTER UPDATE ON ingredient_canonicals BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.id);
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS ingredient_canonicals_search_delete AFTER DELETE ON ingredient_canonicals BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.id);
END;

CREATE TRIGGER IF NOT EXISTS ingredient_aliases_search_insert AFTER INSERT ON ingredient_aliases BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.canonical_id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.canonical_id);
END;

CREATE TRIGGER IF NOT EXISTS ingredient_aliases_search_update AFTER UPDATE ON ingredient_aliases BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.canonical_id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.canonical_id);
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.canonical_id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=NEW.canonical_id);
END;

CREATE TRIGGER IF NOT EXISTS ingredient_aliases_search_delete AFTER DELETE ON ingredient_aliases BEGIN
  DELETE FROM recipe_search_fts WHERE recipe_id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.canonical_id);
  INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
    SELECT r.id,r.title,COALESCE((SELECT group_concat(
      i.name || ' ' || COALESCE(c.name,'') || ' ' ||
      COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
      ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
      WHERE i.recipe_id=r.id),'')
    FROM recipes r WHERE r.id IN (SELECT DISTINCT i.recipe_id FROM ingredients i WHERE i.ingredient_canonical_id=OLD.canonical_id);
END;

INSERT INTO recipe_search_fts(recipe_id,title,ingredient_terms)
SELECT r.id,r.title,COALESCE((SELECT group_concat(
  i.name || ' ' || COALESCE(c.name,'') || ' ' ||
  COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a WHERE a.canonical_id=i.ingredient_canonical_id),''),
  ' ') FROM ingredients i LEFT JOIN ingredient_canonicals c ON c.id=i.ingredient_canonical_id
  WHERE i.recipe_id=r.id),'')
FROM recipes r WHERE NOT EXISTS (
  SELECT 1 FROM recipe_search_fts f WHERE f.recipe_id=r.id
);

-- One UTC-day reservation prevents multiple cron/retry deliveries on the same day.
CREATE TABLE IF NOT EXISTS recipe_publication_days (
  day_utc TEXT PRIMARY KEY,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_recipe_publication_days_published ON recipe_publication_days(published_at);

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

-- Unicode-correct ingredient catalogue lookup, including Cyrillic aliases.
CREATE VIRTUAL TABLE IF NOT EXISTS ingredient_search_fts USING fts5(
  canonical_id UNINDEXED, name, aliases,
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS ingredient_canonicals_fts_insert AFTER INSERT ON ingredient_canonicals BEGIN
  DELETE FROM ingredient_search_fts WHERE canonical_id=NEW.id;
  INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
    SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
      WHERE a.canonical_id=ic.id),'')
    FROM ingredient_canonicals ic WHERE ic.id=NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS ingredient_canonicals_fts_update AFTER UPDATE ON ingredient_canonicals BEGIN
  DELETE FROM ingredient_search_fts WHERE canonical_id=OLD.id;
  INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
    SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
      WHERE a.canonical_id=ic.id),'')
    FROM ingredient_canonicals ic WHERE ic.id=OLD.id;
  DELETE FROM ingredient_search_fts WHERE canonical_id=NEW.id;
  INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
    SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
      WHERE a.canonical_id=ic.id),'')
    FROM ingredient_canonicals ic WHERE ic.id=NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS ingredient_canonicals_fts_delete AFTER DELETE ON ingredient_canonicals BEGIN
  DELETE FROM ingredient_search_fts WHERE canonical_id=OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS ingredient_aliases_fts_insert AFTER INSERT ON ingredient_aliases BEGIN
  DELETE FROM ingredient_search_fts WHERE canonical_id=NEW.canonical_id;
  INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
    SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
      WHERE a.canonical_id=ic.id),'')
    FROM ingredient_canonicals ic WHERE ic.id=NEW.canonical_id;
END;

CREATE TRIGGER IF NOT EXISTS ingredient_aliases_fts_update AFTER UPDATE ON ingredient_aliases BEGIN
  DELETE FROM ingredient_search_fts WHERE canonical_id=OLD.canonical_id;
  INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
    SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
      WHERE a.canonical_id=ic.id),'')
    FROM ingredient_canonicals ic WHERE ic.id=OLD.canonical_id;
  DELETE FROM ingredient_search_fts WHERE canonical_id=NEW.canonical_id;
  INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
    SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
      WHERE a.canonical_id=ic.id),'')
    FROM ingredient_canonicals ic WHERE ic.id=NEW.canonical_id;
END;

CREATE TRIGGER IF NOT EXISTS ingredient_aliases_fts_delete AFTER DELETE ON ingredient_aliases BEGIN
  DELETE FROM ingredient_search_fts WHERE canonical_id=OLD.canonical_id;
  INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
    SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
      WHERE a.canonical_id=ic.id),'')
    FROM ingredient_canonicals ic WHERE ic.id=OLD.canonical_id;
END;

INSERT INTO ingredient_search_fts(canonical_id,name,aliases)
SELECT ic.id,ic.name,COALESCE((SELECT group_concat(a.alias,' ') FROM ingredient_aliases a
  WHERE a.canonical_id=ic.id),'')
FROM ingredient_canonicals ic
WHERE NOT EXISTS(SELECT 1 FROM ingredient_search_fts f WHERE f.canonical_id=ic.id);

-- Per-account pantry snapshot. Changes require an exact revision match.
-- No personal pantry data is stored for guests.
CREATE TABLE IF NOT EXISTS user_pantry_snapshots (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(items_json)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Revocable JWT session versions, safe for legacy tokens issued with version zero.
CREATE TABLE IF NOT EXISTS user_session_versions (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 0 CHECK(version>=0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Evidence references are separate from a manual review flag.
-- Legacy recipes remain readable but don't qualify as source-backed safety matches.
CREATE TABLE IF NOT EXISTS recipe_evidence (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  allergen_evidence_url TEXT,
  nutrition_evidence_url TEXT,
  review_notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
