export const PRODUCTION_API_ORIGIN =
  "https://food-ingredients-api.osohoo691016.workers.dev";

/** Same bucket public URL as apps/api wrangler.toml [vars] R2_PUBLIC_BASE_URL; forks should set NEXT_PUBLIC_R2_PUBLIC_BASE_URL. */
export const PRODUCTION_R2_PUBLIC_ORIGIN =
  "https://pub-10e5fb7fa4594b528d76dcc4cc0272a4.r2.dev";

/**
 * Public API origin (browser + server). For local API, set NEXT_PUBLIC_API_URL in `.env.local`
 * (e.g. http://127.0.0.1:8787). Otherwise defaults match the deployed Worker (`next.config.ts`).
 */
export function apiBase(): string {
  const raw =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL != null
      ? String(process.env.NEXT_PUBLIC_API_URL).trim()
      : "";

  const fromEnv = raw.replace(/\/$/, "");

  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv;

  return PRODUCTION_API_ORIGIN.replace(/\/$/, "");
}

export function r2Base() {
  const fromEnv =
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "").trim() || "";
  if (fromEnv) return fromEnv;
  return PRODUCTION_R2_PUBLIC_ORIGIN.replace(/\/$/, "");
}
