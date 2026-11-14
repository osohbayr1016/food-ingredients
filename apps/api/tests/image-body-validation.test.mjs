import test from "node:test";
import assert from "node:assert/strict";
import { imageMagicMatches, readBoundedImageBody, supportedImageMime } from "../src/lib/imageBodyValidation.ts";

const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0]);
const jpg=new Uint8Array([255,216,255,224,0,0]);
const webp=new Uint8Array([82,73,70,70,1,0,0,0,87,69,66,80]);
const stream=chunks=>new ReadableStream({
  start(controller) {for(const chunk of chunks)controller.enqueue(chunk);controller.close();}
});
test("MIME strings and file signature must match",()=>{
  assert.equal(supportedImageMime("image/png; charset=binary"),"image/png");
  assert.equal(supportedImageMime("image/svg+xml"),null);
  assert.ok(imageMagicMatches(png,"image/png"));
  assert.ok(imageMagicMatches(jpg,"image/jpeg"));
  assert.ok(imageMagicMatches(webp,"image/webp"));
  assert.equal(imageMagicMatches(jpg,"image/png"),false);
  assert.equal(imageMagicMatches(new TextEncoder().encode("<svg></svg>"),"image/jpeg"),false);
});
test("bounded image stream supports chunked requests and rejects oversize early",async()=>{
  const good=await readBoundedImageBody(stream([png.subarray(0,4),png.subarray(4)]),10);
  assert.equal(good.ok,true);
  if(good.ok)assert.deepEqual(good.bytes,png);
  const bad=await readBoundedImageBody(stream([png,png]),10);
  assert.deepEqual(bad,{ok:false,error:"too_large"});
  assert.deepEqual(await readBoundedImageBody(stream([]),10),{ok:false,error:"empty_body"});
  assert.deepEqual(await readBoundedImageBody(null,10),{ok:false,error:"empty_body"});
});
