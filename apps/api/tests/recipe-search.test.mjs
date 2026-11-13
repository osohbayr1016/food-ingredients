import test from "node:test";
import assert from "node:assert/strict";
import { expandRecipeSearch, likePattern, recipeFtsMatch } from "../src/lib/recipeSearch.ts";

test("Mongolian, Latin spelling and English find the same canonical search terms", () => {
  for (const input of ["тахианы   мах", "tahianii mah", "chicken"]) {
    const result = expandRecipeSearch(input);
    assert.ok(result.includes("тахиа"));
    assert.ok(result.includes("chicken"));
  }
  assert.ok(expandRecipeSearch("өндөг").includes("egg"));
  assert.ok(expandRecipeSearch("tums").includes("potato"));
});
test("unknown queries are preserved rather than silently replaced", () => {
  assert.deepEqual(expandRecipeSearch("khuushuur"), ["khuushuur"]);
  assert.deepEqual(expandRecipeSearch(" "), []);
});
test("SQL wildcard characters are escaped for any LIKE-based future query", () => {
  assert.equal(likePattern("10%_salt"), "%10\\%\\_salt%");
});

test("Unicode FTS query keeps Mongolian letters and treats syntax as plain text", () => {
  assert.match(recipeFtsMatch("Тахианы шөл"), /"тахианы"\* AND "шөл"\*/);
  assert.match(recipeFtsMatch("chicken"), /"тахиа"\*/);
  assert.equal(recipeFtsMatch("**"), "");
  assert.ok(!recipeFtsMatch('a" OR NOT b').includes('NOT b'));
});
