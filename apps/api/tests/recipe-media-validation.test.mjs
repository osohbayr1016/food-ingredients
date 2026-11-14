import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(new URL("../package.json",import.meta.url));
const ts=require("typescript");
const code=readFileSync(new URL("../src/lib/recipeValidation.ts",import.meta.url),"utf8");
const transpiled=ts.transpileModule(code,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
}}).outputText;
const mod={exports:{}};
new Function("require","module","exports",transpiled)(
  name=>{if(name==="./recipeMetadata")return {validateRecipeMetadata:()=>[]};throw Error(name);},
  mod,mod.exports,
);
const {validRecipeImageReference:valid,validRecipeImageFields:fields}=mod.exports;
test("accepts HTTPS media, generated R2 keys and local public assets",()=>{
  for(const ref of ["recipes/draft/abcd-1234.webp","/recipe-images/example.png",
    "https://example.org/img.webp"])assert.equal(valid(ref),true,ref);
  assert.equal(fields(null,null),true);
  assert.equal(fields('["recipes/r/1.jpg"]','["recipes/r/2.webp"]'),true);
});
test("rejects traversal, scripts, insecure URLs and malformed gallery fields",()=>{
  for(const ref of ["//evil.example/track.png","http://example.org/x.jpg",
    "javascript:alert(1)","/../admin","recipes//bad.jpg",
    "https://user:pass@example.org/private.jpg","/foo\\bar.jpg",
    "data:image/svg+xml,evil"])assert.equal(valid(ref),false,ref);
  for(const gallery of ['{"x":"bad"}','["//evil"]','["../admin"]',
    "[1]","not json",JSON.stringify(Array(31).fill("recipes/r/a.jpg"))]){
    assert.equal(fields(null,gallery),false,gallery.slice(0,60));
  }
  assert.equal(fields(123,null),false);
});
