PRAGMA foreign_keys = ON;

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
