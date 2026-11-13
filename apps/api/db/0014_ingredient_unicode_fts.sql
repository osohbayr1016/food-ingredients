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
