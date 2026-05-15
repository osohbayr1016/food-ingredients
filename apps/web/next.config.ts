import type { NextConfig } from "next";
import path from "node:path";
import {
  PRODUCTION_API_ORIGIN,
  PRODUCTION_R2_PUBLIC_ORIGIN,
} from "./lib/publicEnv";

const repoRoot = path.join(process.cwd(), "..", "..");
const tracingRoot =
  process.env.CF_PAGES_BUILD === "1" ? process.cwd() : repoRoot;

/** Same defaults as production Worker vars so `next dev` hits the real API/R2 unless `.env.local` overrides. */
function publicEnvDefaults(): NonNullable<NextConfig["env"]> {
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim();
  return {
    NEXT_PUBLIC_API_URL: api || PRODUCTION_API_ORIGIN.replace(/\/$/, ""),
    NEXT_PUBLIC_R2_PUBLIC_BASE_URL:
      r2 || PRODUCTION_R2_PUBLIC_ORIGIN.replace(/\/$/, ""),
  };
}

/** Repo root for `next dev` / first `next build`; `cwd` during CF_PAGES_BUILD so Vercel does not nest `apps/web` twice. */
/** `@xenova/transformers` lazy chunks often fail under `--turbopack`; use default `pnpm dev` (webpack) for pantry scan. */
const nextConfig: NextConfig = {
  outputFileTracingRoot: tracingRoot,
  env: publicEnvDefaults(),
  transpilePackages: ["@xenova/transformers"],
};

export default nextConfig;
