import pathlib
import sqlite3

root = pathlib.Path(__file__).resolve().parents[3]
db = sqlite3.connect(":memory:")
db.executescript((root / "apps/api/db/schema.sql").read_text())
for file in ("0007_recipe_metadata.sql", "0008_auth_rate_limits.sql", "0009_recipe_search_indexes.sql", "0010_publication_queue.sql", "0011_unicode_recipe_search.sql"):
    content = (root / "apps/api/db" / file).read_text()
    db.executescript(content)
    db.executescript(content)  # must be safe to retry

db.execute("""INSERT INTO recipes (id,title,cuisine,description,is_published)
              VALUES ('t','test','Mongolian','test',0)""")
db.execute("""INSERT INTO recipe_metadata (recipe_id, review_status, allergens_json)
              VALUES ('t','pending','[]')""")
assert db.execute("SELECT review_status FROM recipe_metadata WHERE recipe_id='t'").fetchone()[0] == "pending"
try:
    db.execute("""INSERT INTO recipe_metadata (recipe_id,allergens_json)
                  VALUES ('t2','not-json')""")
    raise AssertionError("invalid JSON unexpectedly accepted")
except sqlite3.IntegrityError:
    pass
db.execute("INSERT INTO recipe_publication_queue (recipe_id, queued_by) VALUES ('t','smoke')")
assert db.execute("SELECT status FROM recipe_publication_queue WHERE recipe_id='t'").fetchone()[0] == "queued"
db.execute("UPDATE recipes SET title='Тахианы шөл' WHERE id='t'")
assert db.execute("SELECT recipe_id FROM recipe_search_fts WHERE recipe_search_fts MATCH ?", ('"тахиа"*',)).fetchone()[0] == 't'
db.execute("UPDATE recipes SET title='Будаатай шөл' WHERE id='t'")
assert not db.execute("SELECT recipe_id FROM recipe_search_fts WHERE recipe_search_fts MATCH ?", ('"тахиа"*',)).fetchall()
assert db.execute("SELECT recipe_id FROM recipe_search_fts WHERE recipe_search_fts MATCH ?", ('"будаа"*',)).fetchone()[0] == 't'
print("D1-compatible schema & migrations: smoke test passed")
