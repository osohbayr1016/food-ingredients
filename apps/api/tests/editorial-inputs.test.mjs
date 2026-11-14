import test from "node:test";
import assert from "node:assert/strict";
import {parseTagName,parseMealDbId,parseMealDbSearchQuery} from "../src/lib/editorialInputs.ts";

test("admin tags require readable, bounded names",()=>{
  assert.equal(parseTagName("  Gluten  free  "), "Gluten free");
  assert.equal(parseTagName("Монгол хоол"),"Монгол хоол");
  for(const bad of [undefined, null, 42, {}, "", "a".repeat(81), "a\nb", "a\u0000b"]){
    assert.equal(parseTagName(bad),null);
  }
});
test("TheMealDB identifiers are digits only, avoiding malformed upstream calls",()=>{
  assert.equal(parseMealDbId(" 12345 "), "12345");
  for(const bad of [undefined, 123, "", "x1", "1/../../", "1".repeat(21)]) {
    assert.equal(parseMealDbId(bad),null);
  }
});
test("external meal searches reject excessive or malformed input",()=>{
  assert.equal(parseMealDbSearchQuery("  fried   rice  "),"fried rice");
  for(const bad of ["", 123, "x".repeat(81), "a\u0000b"]) {
    assert.equal(parseMealDbSearchQuery(bad),null);
  }
});
