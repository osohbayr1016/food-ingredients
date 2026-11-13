import test from "node:test";
import assert from "node:assert/strict";
import {authLimitPolicy} from "../src/lib/authRateLimit.ts";
test("account deletion has a tighter per-account attempt budget",()=>{
  assert.deepEqual(authLimitPolicy("delete_account"),{seconds:3600,maxAttempts:6});
  assert.equal(authLimitPolicy("login").seconds,900);
  assert.equal(authLimitPolicy("register").maxAttempts,8);
});
