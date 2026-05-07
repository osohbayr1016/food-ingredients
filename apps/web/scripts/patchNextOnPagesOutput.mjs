import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const workerFile = join(
  here,
  "..",
  ".vercel",
  "output",
  "static",
  "_worker.js",
  "index.js",
);

const original = readFileSync(workerFile, "utf8");

const homeOverridePattern =
  /"\/":\{type:"override",path:"\/favicon\.ico",headers:\{"content-type":"image\/x-icon"\}\}/;
const homeFunctionReplacement =
  '"/":{type:"function",entrypoint:"__next-on-pages-dist__/functions/index.func.js"}';

if (!homeOverridePattern.test(original)) {
  console.log(
    "patch-next-on-pages: home '/' override not found; nothing to patch",
  );
  process.exit(0);
}

const patched = original.replace(homeOverridePattern, homeFunctionReplacement);
writeFileSync(workerFile, patched);
console.log(
  "patch-next-on-pages: rewrote '/' from favicon override -> index function",
);
