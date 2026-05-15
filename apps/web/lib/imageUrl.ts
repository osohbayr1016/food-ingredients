import { r2Base } from "./publicEnv";

/** Local `/…` paths are served from the Next.js `public/` folder. Override image host via NEXT_PUBLIC_R2_PUBLIC_BASE_URL. */
export function recipeImageUrl(key: string | null | undefined) {
  if (!key) return null;
  const t = key.trim();
  if (!t) return null;
  if (t.startsWith("/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  const base = r2Base()?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/${t.replace(/^\//, "")}`;
}
