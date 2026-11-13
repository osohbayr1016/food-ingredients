export const ALLERGEN_OPTIONS = [
  ["milk", "Сүү"], ["egg", "Өндөг"], ["fish", "Загас"],
  ["shellfish", "Хясаа, сам хорхой"], ["tree_nuts", "Модны самар"],
  ["peanuts", "Газрын самар"], ["wheat", "Улаан буудай"],
  ["soy", "Шар буурцаг"], ["sesame", "Гүнжид"],
] as const;

export type RecipeMetadata = {
  source_url?: string | null;
  license_name?: string | null;
  video_url?: string | null;
  review_status?: "pending" | "approved";
  allergen_status?: "unknown" | "ingredients_reviewed";
  allergens?: string[];
  nutrition_source?: string | null;
  allergen_evidence_url?: string | null;
  nutrition_evidence_url?: string | null;
  review_notes?: string | null;
  calories_kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
};

export function embedVideoUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
      const id = host === "youtu.be" ? u.pathname.slice(1) :
        u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d{4,15}$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* invalid URL */ }
  return null;
}
