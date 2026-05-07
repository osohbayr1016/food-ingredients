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
