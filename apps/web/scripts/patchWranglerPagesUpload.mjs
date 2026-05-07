/**
 * Shrinks concurrent Pages asset uploads inside wrangler — large batched uploads
 * often return 502 on POST /pages/assets/upload — the spinner stays at "Uploading... (0/N)".
 * pnpm-patch cannot safely edit Wrangler's 8MB cli.js bundle (truncates). One asset
 * per request is slow but survives flaky edges.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const ultra = `    MAX_BUCKET_SIZE = 256 * 1024;
    MAX_BUCKET_FILE_COUNT = 1;
    BULK_UPLOAD_CONCURRENCY = 1;`;

const patterns = [
  /    MAX_BUCKET_SIZE = 40 \* 1024 \* 1024;\n    MAX_BUCKET_FILE_COUNT = isWindows \? 1e3 : 2e3;\n    BULK_UPLOAD_CONCURRENCY = 3;/,
  /    MAX_BUCKET_SIZE = 1024 \* 1024;\n    MAX_BUCKET_FILE_COUNT = isWindows \? 100 : 8;\n    BULK_UPLOAD_CONCURRENCY = 1;/,
];

const require = createRequire(import.meta.url);
let cliPath;
try {
  cliPath = require.resolve("wrangler/wrangler-dist/cli.js");
} catch {
  console.warn("patchWranglerPagesUpload: wrangler not found, skipping");
  process.exit(0);
}

let src = readFileSync(cliPath, "utf8");
if (
  src.includes(
    "    MAX_BUCKET_SIZE = 256 * 1024;\n    MAX_BUCKET_FILE_COUNT = 1;",
  )
) {
  process.exit(0);
}

for (const re of patterns) {
  if (re.test(src)) {
    src = src.replace(re, ultra);
    writeFileSync(cliPath, src, "utf8");
    process.exit(0);
  }
}

console.error("patchWranglerPagesUpload: Pages upload constants block not found");
process.exit(1);
