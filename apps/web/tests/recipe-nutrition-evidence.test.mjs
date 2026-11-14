import test from "node:test";
import assert from "node:assert/strict";
import {hasVerifiedNutrition} from "../lib/recipeNutritionEvidence.ts";
const approved={
  review_status:"approved",
  nutrition_source:"Validated ingredient report",
  nutrition_evidence_url:"https://example.org/ingredient-report",
  calories_kcal:350,
};
test("nutrition needs editorial approval, real source, valid HTTPS evidence, and a number",()=>{
  assert.equal(hasVerifiedNutrition(approved),true);
  for(const patch of [
    {review_status:"pending"}, {nutrition_source:""}, {nutrition_source:45},
    {nutrition_evidence_url:null},{nutrition_evidence_url:"http://example.org"},
    {nutrition_evidence_url:"https://user:password@example.org"},
    {calories_kcal:null},
    {calories_kcal:"350"}, {calories_kcal:-1}, {calories_kcal:NaN},
  ])assert.equal(hasVerifiedNutrition({...approved,...patch}),false,JSON.stringify(patch));
  assert.equal(hasVerifiedNutrition(null),false);
});
