import test from "node:test";
import assert from "node:assert/strict";
import {portableKey,collectBrowserData} from "../lib/browserDataExport.ts";
test("only explicitly allowed device data keys can be exported",()=>{
 for(const key of ["auth_token","device_id","access_token","admin_secret","food-ingredients-random", "food-ingredients-week-plan-v2:bad"]){
   assert.equal(portableKey(key),false,key);
 }
 for(const key of ["food-ingredients-pantry-v1","food_profile","food_body_nutrition_v1",
   "food-ingredients-week-plan-v2:2026-11-09","food_ingredients_cook_v2:recipe_id:2"]){
   assert.equal(portableKey(key),true,key);
 }
});
test("export filters out credentials and caps oversized records",()=>{
 const entries=[["auth_token","sensitive"],["device_id","device"],
   ["food_profile",'{"name":"Cook"}'],["food_body_nutrition_v1","a".repeat(250000)]];
 const store={length:entries.length,key:i=>entries[i]?.[0]??null,
   getItem:key=>entries.find(x=>x[0]===key)?.[1]??null};
 const {records,omitted}=collectBrowserData(store);
 assert.deepEqual(records,{"food_profile":'{"name":"Cook"}'});
 assert.equal(omitted,1);
});
