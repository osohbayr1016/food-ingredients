import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(here, "..", ".vercel", "output", "static");

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

writeFileSync(join(assetsDir, ".assetsignore"), "_worker.js\n");
console.log(`Wrote .assetsignore to ${assetsDir}`);
