import test from "node:test";
import assert from "node:assert/strict";
import {parsePlannerStorage,cleanPlannerSelections,cleanPlannerChecked,
 cleanPlannerPortions,cleanPlannerTitles} from "../lib/mealPlannerStorage.ts";

test("corrupt legacy storage cannot poison or block cloud syncing",()=>{
  assert.deepEqual(parsePlannerStorage("{"),{});
  assert.deepEqual(parsePlannerStorage("x".repeat(130*1024)),{});
  assert.deepEqual(cleanPlannerSelections({
    "0|dinner":"recipe_1","6|lunch":"","7|dinner":"bad",
    "2|breakfast":"../bad","3|lunch":false,
  }),{"0|dinner":"recipe_1","6|lunch":""});
  assert.deepEqual(cleanPlannerSelections([]),{});
});
test("portions, checklist values and titles follow server bounds",()=>{
  assert.deepEqual(cleanPlannerPortions({"0|dinner":3,"1|lunch":"3",
    "2|dinner":31,"3|dinner":-1,"4|dinner":1.2}),{"0|dinner":3});
  assert.deepEqual(cleanPlannerChecked({"potato|kg":true,"milk|ml":false,
    "untrusted":5,"":true}),{"potato|kg":true,"milk|ml":false});
  assert.deepEqual(cleanPlannerTitles({"recipe-1":"Тахианы шөл",
    "../../broken":"Wrong","recipe-2":"","recipe-3":12}),{"recipe-1":"Тахианы шөл"});
  assert.deepEqual(cleanPlannerChecked(null),{});
});
