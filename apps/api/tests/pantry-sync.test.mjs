import test from "node:test";
import assert from "node:assert/strict";
import { parseAccountPantry, validPantryRevision } from "../src/lib/pantrySync.ts";

const item={canonical_id:"egg",name:"Өндөг",quantity:"6",unit:"ш",expires_on:"2026-11-30"};
test("safe pantry input preserves explicit quantities and dates",()=>{
  assert.deepEqual(parseAccountPantry([item]),[item]);
  assert.deepEqual(parseAccountPantry([]),[]);
});
test("invalid pantry data fails closed, never replaces valid cloud data",()=>{
  for(const bad of [null,{},[item,item],[{...item,expires_on:"2026-02-30"}],
    [{...item,quantity:"Infinity"}],[{...item,quantity:"-1"}],[{...item,canonical_id:""}],
    Array(101).fill(item)]) assert.equal(parseAccountPantry(bad),null);
});
test("revision is bounded and integer, protecting optimistic concurrency",()=>{
  for(const good of [0,1,123]) assert.equal(validPantryRevision(good),true);
  for(const bad of [-1,1.5,NaN,"1",null,1_000_000_000]) assert.equal(validPantryRevision(bad),false);
});
