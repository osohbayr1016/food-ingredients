import { r2Base } from "./publicEnv";

/** Local `/…` paths are served from the Next.js `public/` folder. */
export function recipeImageUrl(key: string | null | undefined) {
  if (!key) return null;
  if (key.startsWith("/")) return key;
  const base = r2Base();
  if (!base) return null;
  return `${base}/${key}`;
}
