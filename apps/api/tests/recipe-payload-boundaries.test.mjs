import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {validateRecipeMetadata} from "../src/lib/recipeMetadata.ts";
const require=createRequire(new URL("../package.json",import.meta.url));
const ts=require("typescript");
const source=readFileSync(new URL("../src/lib/recipeValidation.ts",import.meta.url),"utf8");
const output=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const mod={exports:{}};
new Function("require","module","exports",output)(
  name=>{if(name==="./recipeMetadata")return {validateRecipeMetadata};throw Error(name);},
  mod,mod.exports,
);
const validate=mod.exports.validateRecipePatch;
const valid={
  recipe:{title:"Test recipe",cuisine:"Mongolian",prep_time:5,cook_time:15,difficulty:1,
    description:"Verified recipe draft",serves:2},
  ingredients:[{id:"i1",name:"Potato",quantity:2,unit:"pcs",category_id:"cat-veg"}],
  steps:[{id:"s1",description:"Wash the potatoes."}],
  metadata:{source_url:"https://example.org/test",license_name:"Original"},
  tag_ids:["tg-quick"],
};

test("strict nested recipe IDs and optional fields prevent D1/trim runtime failures",()=>{
  assert.deepEqual(validate(valid),[]);
  for(const bad of [
    {ingredients:[{...valid.ingredients[0],id:42}]},
    {ingredients:[{...valid.ingredients[0],ingredient_canonical_id:42}]},
    {ingredients:[{...valid.ingredients[0],note:{text:"bad"}}]},
    {ingredients:[{...valid.ingredients[0],sort_order:"1"}]},
    {steps:[{...valid.steps[0],id:42}]},
    {steps:[{...valid.steps[0],tip:{lang:"mn"}}]},
    {steps:[{...valid.steps[0],description_template:[]} ]},
    {recipe:{...valid.recipe,image_r2_key:123}},
    {recipe:{...valid.recipe,import_external_id:[]}},
    {tag_ids:["tg-quick","tg-quick"]},
    {tag_ids:[""]},
  ]){
    assert.notDeepEqual(validate({...valid,...bad}),[],JSON.stringify(bad));
  }
});
test("duplicate stable child IDs are rejected before D1 insert batches",()=>{
  const ingredient={...valid.ingredients[0]};
  const step={...valid.steps[0]};
  const ingredientErrors=validate({...valid,ingredients:[ingredient,{...ingredient,name:"Onion"}]});
  const stepErrors=validate({...valid,steps:[step,{...step,description:"Cook slowly."}]});
  assert.ok(ingredientErrors.includes("duplicate_ingredient_ids"));
  assert.ok(stepErrors.includes("duplicate_step_ids"));
  assert.deepEqual(validate({...valid,ingredients:[ingredient,{...ingredient,id:"i2"}]}),[]);
  assert.deepEqual(validate({...valid,steps:[step,{...step,id:"s2"}]}),[]);
});

test("untrusted numeric license cannot crash publish validation",()=>{
  const payload={...valid,
    recipe:{...valid.recipe,is_published:true},
    ingredients:[...valid.ingredients,{...valid.ingredients[0],id:"i2",name:"Onion"}],
    steps:[...valid.steps,{...valid.steps[0],id:"s2",description:"Serve the meal."}],
    metadata:{review_status:"approved",license_name:123},
  };
  assert.doesNotThrow(()=>validate(payload));
  const errs=validate(payload);
  assert.ok(errs.includes("metadata_invalid_license"));
  assert.ok(errs.includes("publish_requires_content_rights"));
});

test("metadata validation is resilient to malformed untrusted JSON",()=>{
  for(const value of [
    {source_url:42},{video_url:{url:"https://example.org"}},
    {allergen_status:"ingredients_reviewed",allergen_evidence_url:17},
    {license_name:12},{nutrition_source:{}},
    {protein_g:20,nutrition_source:12,nutrition_evidence_url:42},
    {allergens:["milk",42]},
  ]){
    assert.ok(validateRecipeMetadata(value).length>0,JSON.stringify(value));
    assert.ok(validate({...valid,metadata:value}).length>0,JSON.stringify(value));
  }
  assert.ok(validateRecipeMetadata([]).length>0);
});
