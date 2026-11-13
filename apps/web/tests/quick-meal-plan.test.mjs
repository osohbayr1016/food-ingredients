import test from "node:test";
import assert from "node:assert/strict";
import {fillQuickDinners,mapBounded} from "../lib/quickMealPlan.ts";
const recipe=(i,cuisine="Монгол",minutes=25)=>({
 id:"r"+i,title:"Meal "+i,cuisine,prep_time:5,cook_time:minutes-5,difficulty:1,
});
test("one click fills a week of varied dinners without overwriting planned meals",()=>{
 const recipes=Array.from({length:12},(_,i)=>recipe(i,i%2?"Япон":"Монгол"));
 const result=fillQuickDinners(recipes,{"0|dinner":"favorite","2|breakfast":"breakfast"},"2026-11-09");
 assert.equal(result.added,6);
 assert.equal(result.plan["0|dinner"],"favorite");
 assert.equal(result.plan["2|breakfast"],"breakfast");
 assert.equal(new Set(Object.values(result.plan)).size,8);
 for(let i=1;i<7;i++)assert.ok(result.plan[`${i}|dinner`]);
});
test("unknown cooking times and complicated recipes are never auto-selected",()=>{
 const result=fillQuickDinners([recipe(1,"Монгол",0),recipe(2,"Монгол",100),{...recipe(3),difficulty:3}],{},"2026-11-09");
 assert.equal(result.added,0);
});
test("short catalogues leave remaining days empty rather than inventing recipes",()=>{
 const result=fillQuickDinners([recipe(1),recipe(1)],{},"2026-11-09");
 assert.equal(result.added,1);
 assert.equal(Object.values(result.plan).length,1);
});
test("bounded concurrency never starts more than the configured number",async()=>{
 let active=0,max=0;
 const values=Array.from({length:17},(_,i)=>i);
 const result=await mapBounded(values,3,async value=>{
   active++;max=Math.max(max,active);
   await new Promise(resolve=>setTimeout(resolve,1));
   active--;return value*2;
 });
 assert.deepEqual(result,values.map(n=>n*2));
 assert.ok(max<=3);
 await assert.rejects(mapBounded(values,0,async x=>x),/invalid_parallelism/);
});
