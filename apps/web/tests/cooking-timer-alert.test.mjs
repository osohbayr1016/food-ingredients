import test from "node:test";
import assert from "node:assert/strict";
import {shouldNotifyTimer} from "../lib/cookingTimerNotification.ts";

test("a finished timer alerts once, and again when restarted",()=>{
  const notified=new Map();
  const now=10_000;
  const original={id:"step-1",endsAt:now-1000};
  const restarted={id:"step-1",endsAt:now+1000};
  assert.equal(shouldNotifyTimer(original,notified,now),true);
  assert.equal(shouldNotifyTimer(original,notified,now),false);
  assert.equal(shouldNotifyTimer(restarted,notified,now),false);
  assert.equal(shouldNotifyTimer(restarted,notified,now+1000),true);
  assert.equal(shouldNotifyTimer(restarted,notified,now+1001),false);
});
test("malformed timer timestamps never cause notification",()=>{
  const notified=new Map();
  assert.equal(shouldNotifyTimer({id:"",endsAt:1},notified,100),false);
  assert.equal(shouldNotifyTimer({id:"a",endsAt:NaN},notified,100),false);
  assert.equal(shouldNotifyTimer({id:"a",endsAt:Infinity},notified,100),false);
  assert.equal(notified.size,0);
});
