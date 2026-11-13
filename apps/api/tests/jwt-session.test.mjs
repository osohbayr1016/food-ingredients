import test from "node:test";
import assert from "node:assert/strict";
import { signJwt, verifyJwt } from "../src/lib/jwtHs256.ts";
const secret="long-test-session-secret-change-me";
test("versioned signed JWT validates and wrong secret fails",async()=>{
  const jwt=await signJwt({sub:"user-1",role:"user",ver:4},secret,600);
  assert.deepEqual(await verifyJwt(jwt,secret),{sub:"user-1",role:"user",ver:4});
  assert.equal(await verifyJwt(jwt,secret+"changed"),null);
});
test("old token gets zero version until revoked",async()=>{
  const jwt=await signJwt({sub:"user-1",role:"user"},secret,600);
  assert.equal((await verifyJwt(jwt,secret))?.ver,0);
  assert.equal(await verifyJwt(jwt.slice(2),secret),null);
});
