import test from "node:test";
import assert from "node:assert/strict";
import {parseCredentials} from "../src/lib/authInput.ts";
test("credential fields require bounded strings",()=>{
 assert.deepEqual(parseCredentials({username:" cook ",password:"12345678"}),{username:"cook",password:"12345678"});
 for(const bad of [null,[],{}, {username:{},password:"password"},
    {username:"test",password:123}, {username:"test",password:""},
    {username:"x".repeat(100),password:"validpass"},
    {username:"test",password:"p".repeat(300)}]){
   assert.equal(parseCredentials(bad),null);
 }
});
