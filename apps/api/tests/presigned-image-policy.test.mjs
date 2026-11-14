import test from "node:test";
import assert from "node:assert/strict";
import {PutObjectCommand,S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {parsePresignImageRequest} from "../src/lib/presignedImagePolicy.ts";
import {MAX_RECIPE_IMAGE_BYTES} from "../src/lib/imageBodyValidation.ts";
test("direct R2 uploads require allowed image type and bounded byte length",()=>{
  assert.deepEqual(parsePresignImageRequest({content_type:"image/png",size_bytes:200}),
    {ok:true,contentType:"image/png",sizeBytes:200});
  for(const bad of [
    {content_type:"image/svg+xml",size_bytes:100},
    {content_type:"image/png",size_bytes:0},
    {content_type:"image/png",size_bytes:MAX_RECIPE_IMAGE_BYTES+1},
    {content_type:"image/jpeg",size_bytes:"100"},
    {content_type:"image/webp",size_bytes:NaN},
    {content_type:"image/png",size_bytes:1.5},
  ])assert.equal(parsePresignImageRequest(bad).ok,false,JSON.stringify(bad));
});
test("presigned PUT URL binds content length and MIME type to signature",async()=>{
  const client=new S3Client({region:"auto",
    endpoint:"https://testaccount.r2.cloudflarestorage.com",
    credentials:{accessKeyId:"test-key",secretAccessKey:"test-secret"}});
  const command=new PutObjectCommand({Bucket:"images",Key:"recipes/draft/test.png",
    ContentLength:345,ContentType:"image/png"});
  const url=await getSignedUrl(client,command,{
    expiresIn:300,signableHeaders:new Set(["content-length","content-type"]),
  });
  const signed=new URL(url).searchParams.get("X-Amz-SignedHeaders")??"";
  assert.ok(signed.split(";").includes("content-length"),signed);
  assert.ok(signed.split(";").includes("content-type"),signed);
});
