import type { NextConfig } from "next";
import path from "node:path";

const repoRoot = path.join(process.cwd(), "..", "..");

/** Monorepo root tracing helps local/next dev; `vercel build` (next-on-pages) duplicates `apps/web` in paths without this off. */
const nextConfig: NextConfig = process.env.CF_PAGES_BUILD
  ? {}
  : { outputFileTracingRoot: repoRoot };

export default nextConfig;
