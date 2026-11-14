import test from "node:test";
import assert from "node:assert/strict";
import {parseRecipeSort,recipeSortSql} from "../src/lib/recipeSort.ts";

test("only known sort values are accepted",()=>{
  assert.equal(parseRecipeSort(undefined),"newest");
  for(const value of ["newest","quickest","easiest"]){
    assert.equal(parseRecipeSort(value),value);
  }
  for(const value of ["random","r.id DESC","slowest","QUICKEST"]) {
    assert.equal(parseRecipeSort(value),null);
  }
});
test("all sort clauses use stable identifiers and exclude unknown times from quickest first",()=>{
  const quick=recipeSortSql("quickest");
  assert.match(quick,/CASE WHEN .* > 0 THEN 0 ELSE 1 END ASC/);
  assert.match(quick,/r\.id ASC$/);
  assert.match(recipeSortSql("easiest"),/^r\.difficulty ASC,/);
  assert.match(recipeSortSql("newest"),/^COALESCE\(pub\.published_at,r\.created_at\) DESC/);
});
