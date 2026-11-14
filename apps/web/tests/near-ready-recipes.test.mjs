import test from "node:test";
import assert from "node:assert/strict";
import {missingIngredientCount,nearReadyRecipes} from "../lib/nearReadyRecipes.ts";
const r=(id,missing,extras={})=>({
 recipe_id:id,title:id,cuisine:"Mongolian",description:"",prep_time:5,cook_time:5,
 difficulty:1,serves:2,image_r2_key:null,match_ratio:0.8,matched_count:2,total_ingredients:3,
 ingredients_preview:[],missing_count:missing,...extras,
});
test("near-ready filter includes zero and one missing ingredient only",()=>{
 const input=[r("a",0),r("b",1),r("c",2),r("d",null)];
 assert.deepEqual(nearReadyRecipes(input).map(x=>x.recipe_id),["a","b"]);
});
test("unknown quantities are not incorrectly certified as sufficient",()=>{
 const ingredient={name:"Egg",quantity:2,unit:"pcs",category_name:"Other",note:null,matched:true,quantity_status:"unknown"};
 const withUnknown=r("unknown",null,{ingredients_preview:[ingredient]});
 assert.equal(missingIngredientCount(withUnknown),0);
 assert.equal(withUnknown.availability==="quantities_match",false);
 assert.deepEqual(nearReadyRecipes([withUnknown]).map(x=>x.recipe_id),["unknown"]);
});
test("legacy results without count require usable ingredient preview data",()=>{
 assert.equal(missingIngredientCount(r("legacy",undefined,{ingredients_preview:[]})),null);
 const missing={name:"Milk",quantity:1,unit:"l",category_name:"Other",note:null,matched:false,quantity_status:"missing"};
 assert.equal(missingIngredientCount(r("legacy",undefined,{ingredients_preview:[missing]})),1);
 assert.deepEqual(nearReadyRecipes([r("a",3)],-1),[]);
});
