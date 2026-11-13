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
