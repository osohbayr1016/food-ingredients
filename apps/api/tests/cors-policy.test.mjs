import test from "node:test";
import assert from "node:assert/strict";
import {allowedCorsOrigin} from "../src/lib/corsPolicy.ts";
test("CORS never reflects unapproved origin or wildcard fallback",()=>{
 const origins="https://food.example,https://admin.example";
 assert.equal(allowedCorsOrigin("https://food.example",origins),"https://food.example");
 for(const value of ["https://evil.example","null","http://food.example","https://food.example.evil.com",undefined]){
   assert.equal(allowedCorsOrigin(value,origins),null);
 }
 assert.equal(allowedCorsOrigin("https://foo.example",""),null);
});
