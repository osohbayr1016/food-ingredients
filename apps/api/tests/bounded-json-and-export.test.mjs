import test from "node:test";
import assert from "node:assert/strict";
import {readBoundedJson} from "../src/lib/boundedJson.ts";
import {mealPlanExportRows} from "../src/lib/mealPlanExport.ts";
const stream=parts=>new ReadableStream({start(controller){
  for(const part of parts) controller.enqueue(part);
  controller.close();
}});
const enc=new TextEncoder();
test("small streamed JSON parses across chunk boundaries",async()=>{
  const bytes=enc.encode('{"x":"Монгол","count":1}');
  const result=await readBoundedJson(stream([bytes.subarray(0,5),bytes.subarray(5)]),128);
  assert.deepEqual(result,{ok:true,value:{x:"Монгол",count:1}});
});
test("body size is enforced even without a Content-Length header",async()=>{
  const bytes=enc.encode('{"data":"'+("a".repeat(300))+'"}');
  assert.deepEqual(await readBoundedJson(stream([bytes.subarray(0,40),bytes.subarray(40)]),128),
    {ok:false,error:"payload_too_large"});
  assert.deepEqual(await readBoundedJson(stream([]),64),{ok:false,error:"invalid_json"});
  assert.deepEqual(await readBoundedJson(null,64),{ok:false,error:"invalid_json"});
  assert.deepEqual(await readBoundedJson(stream([enc.encode('{"broken":')]),64),
    {ok:false,error:"invalid_json"});
});
test("account export includes every property of a saved weekly plan",()=>{
  const [row]=mealPlanExportRows([{
    week_start:"2026-11-09",revision:7,updated_at:"2026-11-14 12:00:00",
    plan_json:'{"0|dinner":"r1"}',portions_json:'{"0|dinner":3}',
    checked_json:'{"milk|ml":true}',titles_json:'{"r1":"Тахианы шөл"}',
  }]);
  assert.deepEqual(row,{
    week_start:"2026-11-09",revision:7,updated_at:"2026-11-14 12:00:00",
    plan:{"0|dinner":"r1"},portions:{"0|dinner":3},
    checked:{"milk|ml":true},titles:{r1:"Тахианы шөл"},
  });
});

test("request-specific API budgets reject oversize JSON streams at the exact byte boundary",async()=>{
  const bytes=enc.encode(JSON.stringify({value:"x".repeat(4096)}));
  const atLimit=await readBoundedJson(stream([bytes.subarray(0,100),bytes.subarray(100)]),bytes.byteLength);
  assert.equal(atLimit.ok,true);
  const exceeded=await readBoundedJson(stream([bytes.subarray(0,100),bytes.subarray(100)]),bytes.byteLength-1);
  assert.deepEqual(exceeded,{ok:false,error:"payload_too_large"});
});
test("rejects incomplete multibyte JSON rather than repairing the payload silently",async()=>{
  const bytes=enc.encode('{"title":"Монгол"}');
  const bad=bytes.slice(0,bytes.length-3);
  const result=await readBoundedJson(stream([bad]),512);
  assert.deepEqual(result,{ok:false,error:"invalid_json"});
});
