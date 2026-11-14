import test from "node:test";
import assert from "node:assert/strict";
import {parseMealPlanSnapshot,validWeekStart} from "../src/lib/mealPlanSync.ts";
const example={
  week_start:"2026-11-09",expected_revision:0,
  plan:{"0|dinner":"rec-test","1|lunch":""},
  portions:{"0|dinner":3},
  checked:{"cn-potato|г":true},
  titles:{"rec-test":"Ногоотой хоол"},
};
test("weekly plan only accepts a valid Monday with safe fields",()=>{
  assert.equal(validWeekStart("2026-11-09"),true);
  for(const bad of ["2026-11-10","2026-02-30","2026-13-09","garbage","1999-11-08"]){
    assert.equal(validWeekStart(bad),false,bad);
  }
  assert.deepEqual(parseMealPlanSnapshot(example),example);
});
test("malformed or excessive client plan payloads fail closed",()=>{
  for(const bad of [
    {expected_revision:-1},{expected_revision:1.5},{expected_revision:"0"},
    {plan:{"7|dinner":"abc"}},{plan:{"0|dinner":"../secret"}},
    {portions:{"0|dinner":0}},{portions:{"0|dinner":"3"}},
    {checked:{"\u0000":true}},{checked:{"x":1}},
    {titles:{"r1":{title:"oops"}}},{titles:{"../a":"title"}},
    {plan:null},
  ]){
    assert.equal(parseMealPlanSnapshot({...example,...bad}),null,JSON.stringify(bad));
  }
});
