-- Weekly meal plans are opt-in cloud snapshots with compare-and-swap revisions.
-- Existing browser-local plans are never migrated without user action.
CREATE TABLE IF NOT EXISTS user_meal_plan_snapshots (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL CHECK (length(week_start) = 10),
  plan_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(plan_json)),
  portions_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(portions_json)),
  checked_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(checked_json)),
  titles_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(titles_json)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id,week_start)
);
