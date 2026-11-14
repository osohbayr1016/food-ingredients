import test from "node:test";
import assert from "node:assert/strict";
import {parsePantry,parseFilters,parseSuggestInput,validateSuggestFilters} from "../src/lib/suggestBodyParse.ts";

const dangerous={toString:null};
test("untrusted nested ingredient shapes cannot crash the suggestion parser",()=>{
  for(const row of [
    {name:dangerous,canonical_id:""},
    {name:"Rice",quantity:dangerous,unit:dangerous},
    {name:"Rice",quantity:{"valueOf":null},unit:{"toString":null}},
    {name:[],quantity:1,unit:"g"},
  ]){
    assert.doesNotThrow(()=>parsePantry({pantry:[row]}));
  }
  const parsed=parsePantry({pantry:[{name:"Rice",quantity:dangerous,unit:dangerous}]});
  assert.deepEqual(parsed,[{canonical_id:undefined,name:"Rice",quantity:undefined,unit:""}]);
  assert.deepEqual(parsePantry({pantry:[{name:{toString:null},canonical_id:""}]}),[]);
});
test("invalid filter types do not bypass specified restrictions",()=>{
  for(const filters of [
    {max_total_minutes:dangerous},{max_difficulty:[]},
    {min_serves:"nope"},{max_serves:"Infinity"},
    {min_serves:10,max_serves:2},
    {max_difficulty:4},{max_total_minutes:0},{max_total_minutes:"2e2"},
  ]){
    assert.equal(validateSuggestFilters({ingredient_names:["Rice"],filters}),false,JSON.stringify(filters));
    assert.doesNotThrow(()=>parseFilters({filters}));
  }
  assert.equal(validateSuggestFilters({ingredient_names:["Rice"],filters:{max_total_minutes:"30",max_difficulty:2}}),true);
  assert.equal(validateSuggestFilters({ingredient_names:["Rice"],filters:{min_serves:2,max_serves:5}}),true);
  assert.equal(validateSuggestFilters(null),false);
  assert.deepEqual(parseSuggestInput({ingredient_names:["Rice"],filters:{max_total_minutes:dangerous}})?.legacyNames,["rice"]);
});
