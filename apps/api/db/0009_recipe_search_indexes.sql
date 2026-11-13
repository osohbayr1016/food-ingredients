-- Indexes for paginated recipe lists and canonical pantry matches.
CREATE INDEX IF NOT EXISTS ix_recipes_pub_created ON recipes(is_published, created_at DESC, id ASC);
CREATE INDEX IF NOT EXISTS ix_ingredients_canonical_recipe ON ingredients(ingredient_canonical_id, recipe_id);
CREATE INDEX IF NOT EXISTS ix_ingredients_lower_name ON ingredients(lower(name));
