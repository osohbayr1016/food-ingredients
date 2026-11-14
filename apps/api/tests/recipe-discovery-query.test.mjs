import test from "node:test";
import assert from "node:assert/strict";
import {parseRecipeDiscoveryParams} from "../src/lib/recipeDiscoveryQuery.ts";

test("valid discovery facets are trimmed, bounded and normalized",()=>{
  assert.deepEqual(parseRecipeDiscoveryParams({
    cuisine:"  Mongolian ",tag:"  Soup ",q:"  ТАХИАНЫ ШӨЛ ",
  }),{ok:true,value:{cuisine:"Mongolian",tag:"Soup",query:"тахианы шөл"}});
  assert.deepEqual(parseRecipeDiscoveryParams({}),{ok:true,value:{
    cuisine:undefined,tag:undefined,query:undefined,
  }});
});
test("long or hostile public filters fail instead of silently broadening search",()=>{
  for(const [input,error] of [
    [{cuisine:"x".repeat(81)},"invalid_cuisine"],
    [{tag:"x".repeat(81)},"invalid_tag"],
    [{q:"x".repeat(101)},"invalid_query"],
    [{q:"chicken\nsecret"},"invalid_query"],
    [{tag:"bad\u0000name"},"invalid_tag"],
  ]){
    assert.deepEqual(parseRecipeDiscoveryParams(input),{ok:false,error});
  }
  assert.equal(parseRecipeDiscoveryParams({q:"Монгол"}).ok,true);
});
