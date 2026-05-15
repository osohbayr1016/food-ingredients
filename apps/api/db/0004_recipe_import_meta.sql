-- Recipe import provenance (TheMealDB id, etc.)
ALTER TABLE recipes ADD COLUMN import_source TEXT;
ALTER TABLE recipes ADD COLUMN import_external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ix_recipes_import_ext ON recipes(import_source, import_external_id);
