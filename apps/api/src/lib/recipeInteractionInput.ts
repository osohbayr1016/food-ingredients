/** Validate untrusted recipe identifiers before reaching D1 or string methods. */
export function parseRecipeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return /^[A-Za-z0-9_-]{1,150}$/.test(id) ? id : null;
}

export type CookHistoryInput = {
  recipe_id: string;
  rating: number | null;
  personal_note: string | null;
};

/** A malformed rating/note must return HTTP 400, not an uncaught exception. */
export function parseCookHistoryInput(value: unknown): CookHistoryInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const recipe_id = parseRecipeId(body.recipe_id);
  if (!recipe_id) return null;
  const rawRating = body.rating;
  if (rawRating != null && (
    typeof rawRating !== "number" || !Number.isInteger(rawRating) ||
    rawRating < 1 || rawRating > 5
  )) return null;
  const rawNote = body.personal_note;
  if (rawNote != null && (typeof rawNote !== "string" || rawNote.length > 2000)) return null;
  return {
    recipe_id,
    rating: rawRating == null ? null : rawRating as number,
    personal_note: rawNote == null ? null : rawNote as string,
  };
}
