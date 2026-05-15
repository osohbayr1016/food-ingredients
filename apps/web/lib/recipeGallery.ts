import { recipeImageUrl } from "@/lib/imageUrl";

export function parseRecipeGalleryKeys(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

export function galleryImageUrls(raw: string | null | undefined): (string | null)[] {
  return parseRecipeGalleryKeys(raw).map((k) => recipeImageUrl(k));
}

/** Raw keys for hero + gallery, deduped, `image_r2_key` first. Supports JSON array in `image_r2_key`. */
function collectHeroKeys(
  imageR2Key: string | null | undefined,
  galleryRaw: string | null | undefined,
): string[] {
  const out: string[] = [];
  const push = (k: string) => {
    const t = k.trim();
    if (t && !out.includes(t)) out.push(t);
  };

  const main = imageR2Key?.trim();
  if (main?.startsWith("[") && main.endsWith("]")) {
    try {
      const p = JSON.parse(main) as unknown;
      if (Array.isArray(p)) {
        for (const x of p)
          if (typeof x === "string" && x.length) push(x);
      }
    } catch {
      push(main);
    }
  } else if (main) {
    push(main);
  }

  for (const k of parseRecipeGalleryKeys(galleryRaw)) push(k);
  return out;
}

/** Resolved URLs for the recipe hero carousel (hero + gallery). */
export function recipeHeroSlideUrls(
  imageR2Key: string | null | undefined,
  galleryRaw: string | null | undefined,
): string[] {
  return collectHeroKeys(imageR2Key, galleryRaw)
    .map((k) => recipeImageUrl(k))
    .filter((u): u is string => u != null && u.length > 0);
}
