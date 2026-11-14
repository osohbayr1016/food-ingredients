import { r2Base } from "./publicEnv";

/** Local `/…` paths are served from the Next.js `public/` folder. Override image host via NEXT_PUBLIC_R2_PUBLIC_BASE_URL. */
export function recipeImageUrl(key: string | null | undefined) {
  if (!key) return null;
  const t = key.trim();
  if (!t) return null;
  // Never turn protocol-relative, traversal or active-content paths into image URLs.
  if (/[\\\u0000-\u001F\u007F]/.test(t) || t.startsWith("//")) return null;
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      return u.protocol === "https:" && !u.username && !u.password ? t : null;
    } catch { return null; }
  }
  const pathPart = t.startsWith("/") ? t.slice(1) : t;
  if (!pathPart || !/^[\p{L}\p{N}_./~-]+$/u.test(pathPart) ||
      pathPart.split("/").some(part => !part || part === "." || part === "..")) return null;
  if (t.startsWith("/")) return t;
  const base = r2Base()?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/${t.replace(/^\//, "")}`;
}
