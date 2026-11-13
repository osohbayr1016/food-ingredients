import test from "node:test";
import assert from "node:assert/strict";
import {safeLoginDestination} from "../lib/safeRedirect.ts";
test("only bounded relative in-app paths are accepted after login",()=>{
  for(const good of ["/","/profile","/recipe/abc/cook?serves=3","/saved#liked"]){
    assert.equal(safeLoginDestination(good),good);
  }
  for(const bad of [null,23,"","//evil.com","/\\evil.com","https://evil.com","javascript:alert(1)",
    "/%2f%2fevil.com","/%5cevil.com","/\nfoo","/".repeat(1100)]){
    assert.equal(safeLoginDestination(bad),"/profile");
  }
});
