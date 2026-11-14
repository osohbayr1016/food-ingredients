import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hashPassword,verifyPassword } from "../src/lib/password.ts";

test("legacy auth migration never inserts a shared administrator hash",()=>{
  const sql=readFileSync(new URL("../db/0003_auth_users.sql",import.meta.url),"utf8");
  assert.doesNotMatch(sql,/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+users\s*\(/i);
  assert.doesNotMatch(sql,/00000000-0000-4000-8000-000000000001/);
});

test("malformed password hashes fail before expensive key derivation",async()=>{
  for(const stored of [
    "", "bad", "NaN$aabbccddeeff0011$"+"a".repeat(64),
    "1000000000$aabbccddeeff0011$"+"a".repeat(64),
    "100000.5$aabbccddeeff0011$"+"a".repeat(64),
    "100000$invalidsalt"+"$"+"a".repeat(64),
    "100000$aabbccddeeff0011$xyz",
    "100000$aabbccddeeff0011$"+"a".repeat(63),
    "a".repeat(257),
  ]){
    assert.equal(await verifyPassword("pass",stored),false,stored.slice(0,24));
  }
});

test("existing PBKDF2 format remains verifiable",async()=>{
  const hash=await hashPassword("unique long password");
  assert.equal(await verifyPassword("unique long password",hash),true);
  assert.equal(await verifyPassword("incorrect password",hash),false);
});
