import test from "node:test";
import assert from "node:assert/strict";
import { mergePantryInventories } from "../lib/pantryMerge.ts";
const ing=(id,quantity="")=>({canonical_id:id,name:id,quantity,unit:"г",expires_on:""});
test("merge adds cloud-only ingredients without losing local quantities",()=>{
  const result=mergePantryInventories([ing("carrot","200")],[ing("carrot","100"),ing("rice","500")]);
  assert.deepEqual(result.items,[ing("carrot","200"),ing("rice","500")]);
  assert.equal(result.added,1);
  assert.deepEqual(result.conflicts,["carrot"]);
});
test("equal pantry quantities do not count as conflicts",()=>{
  const result=mergePantryInventories([ing("carrot","200")],[ing("carrot","200")]);
  assert.deepEqual(result.conflicts,[]);
  assert.equal(result.added,0);
});
test("maximum 100 slots never silently drops user device records",()=>{
  const result=mergePantryInventories(Array.from({length:100},(_,i)=>ing("local"+i)),
    [ing("remote1")]);
  assert.equal(result.items.length,100);
  assert.deepEqual(result.omitted,["remote1"]);
});
test("injected malformed remote rows are ignored",()=>{
  const result=mergePantryInventories([ing("local")],[{...ing("remote"),expires_on:"bad"}]);
  assert.equal(result.items.length,2);
  assert.equal(result.items[1].expires_on,"");
});
