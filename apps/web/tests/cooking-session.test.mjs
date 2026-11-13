import test from "node:test";
import assert from "node:assert/strict";
import {restoreCookingSession} from "../lib/cookingSession.ts";
const now=1_800_000_000_000;
test("cooking progress resumes only matching recipe",()=>{
 const raw=JSON.stringify({recipeId:"r1",step:99,timers:[{id:"t",label:"Boil",endsAt:now+1000}]});
 assert.deepEqual(restoreCookingSession(raw,"r1",4,now),{
   step:3,timers:[{id:"t",label:"Boil",endsAt:now+1000}],
 });
 assert.equal(restoreCookingSession(raw,"r2",4,now),null);
});
test("invalid timers are discarded without losing progress",()=>{
 const raw=JSON.stringify({recipeId:"r1",step:-1,timers:[
   {id:"old",label:"Old",endsAt:now-600_000},
   {id:"future",label:"Invalid",endsAt:now+48*3600_000},
   {id:"valid",label:"Current",endsAt:now},
 ]});
 const restored=restoreCookingSession(raw,"r1",2,now);
 assert.equal(restored?.step,0);
 assert.deepEqual(restored?.timers,[{id:"valid",label:"Current",endsAt:now}]);
 assert.equal(restoreCookingSession("{","r1",3),null);
 assert.equal(restoreCookingSession("null","r1",3),null);
});
