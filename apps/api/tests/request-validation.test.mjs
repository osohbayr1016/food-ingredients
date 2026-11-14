import test from "node:test";
import assert from "node:assert/strict";
import { parseRecipeId, parseCookHistoryInput } from "../src/lib/recipeInteractionInput.ts";
import { safeRecipeUploadScope } from "../src/lib/uploadKeyScope.ts";

test("recipe identifiers are bounded strings, not arbitrary JSON", () => {
  assert.equal(parseRecipeId(" r-123_foo "), "r-123_foo");
  for (const bad of [null, 5, {}, [], "", " ", "../admin", "recipe/id", "id\n1", "x".repeat(151)]) {
    assert.equal(parseRecipeId(bad), null);
  }
});

test("history validates ratings and notes without silently coercing values", () => {
  assert.deepEqual(parseCookHistoryInput({recipe_id:" recipe_1 ",rating:5,personal_note:"Good"}),
    {recipe_id:"recipe_1",rating:5,personal_note:"Good"});
  assert.deepEqual(parseCookHistoryInput({recipe_id:"recipe_1"}),
    {recipe_id:"recipe_1",rating:null,personal_note:null});
  for (const bad of [null, [], {recipe_id:1}, {recipe_id:"r1",rating:"5"},
    {recipe_id:"r1",rating:0}, {recipe_id:"r1",rating:1.5},
    {recipe_id:"r1",rating:6}, {recipe_id:"r1",personal_note:42},
    {recipe_id:"r1",personal_note:"a".repeat(2001)}]) {
    assert.equal(parseCookHistoryInput(bad), null);
  }
});

test("R2 recipe scopes reject path traversal and separators", () => {
  assert.equal(safeRecipeUploadScope(undefined), "draft");
  assert.equal(safeRecipeUploadScope(" dish_123 "), "dish_123");
  for (const bad of [23, "../other", "a/b", "/absolute", "..", "bad?query",
    "a\\b", "food%2Fother", "x".repeat(151)]) {
    assert.equal(safeRecipeUploadScope(bad), null);
  }
});
