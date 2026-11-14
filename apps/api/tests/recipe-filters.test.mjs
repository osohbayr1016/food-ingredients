import test from "node:test";
import assert from "node:assert/strict";
import {parseRecipeListFilters} from "../src/lib/recipeListFilters.ts";

test("public recipe filters are strict and bounded",()=>{
  assert.deepEqual(parseRecipeListFilters(undefined,undefined),
    {filters:{difficulty:null,maxTotalMinutes:null}});
  assert.deepEqual(parseRecipeListFilters("1","30"),
    {filters:{difficulty:1,maxTotalMinutes:30}});
  for(const bad of ["0","4","1.2","x","Infinity","NaN"]){
    assert.deepEqual(parseRecipeListFilters(bad,undefined),{error:"invalid_difficulty"});
  }
  for(const bad of ["0","1441","2.5","oops","Infinity","-1"]){
    assert.deepEqual(parseRecipeListFilters(undefined,bad),{error:"invalid_max_cook_time"});
  }
});
