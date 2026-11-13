import test from "node:test";
import assert from "node:assert/strict";
import {parseGuestLikeIds} from "../src/lib/guestLikes.ts";
test("guest favorites are validated, deduped and bounded",()=>{
 assert.deepEqual(parseGuestLikeIds(["r1"," r1 ","r_2"]),["r1","r_2"]);
 assert.deepEqual(parseGuestLikeIds(["6a5f3ab9-9999-4000-8000-11"]),["6a5f3ab9-9999-4000-8000-11"]);
 for(const bad of [null,[],{},Array(31).fill("r"),[""],["../admin"],["id\nabc"],[3]]){
   assert.equal(parseGuestLikeIds(bad),null);
 }
});
