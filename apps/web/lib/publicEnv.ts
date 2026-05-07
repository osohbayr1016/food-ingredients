export const PRODUCTION_API_ORIGIN =
  "https://food-ingredients-api.osohoo691016.workers.dev";

/** Next inlines NEXT_PUBLIC_* for the browser; SSR on Workers must never use a bare path. */
export function apiBase(): string {
  const raw =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL != null
      ? String(process.env.NEXT_PUBLIC_API_URL).trim()
      : "";

  const fromEnv = raw.replace(/\/$/, "");
  const isBrowser = typeof window !== "undefined";

  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv;

  const likelyNextDevServer =
    typeof process !== "undefined" && process.env.NODE_ENV === "development";

  if (likelyNextDevServer) return "http://127.0.0.1:8787";

  if (!isBrowser) return PRODUCTION_API_ORIGIN;

  return PRODUCTION_API_ORIGIN;
}

export function r2Base() {
  return process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";
}
