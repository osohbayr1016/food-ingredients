export type RecipeListFilters = {
  difficulty: number | null;
  maxTotalMinutes: number | null;
};

/** Reject invalid query values rather than silently dropping user-selected filters. */
export function parseRecipeListFilters(
  rawDifficulty: string | undefined,
  rawMaxCookTime: string | undefined,
): { filters: RecipeListFilters } | { error: "invalid_difficulty" | "invalid_max_cook_time" } {
  let difficulty: number | null = null;
  let maxTotalMinutes: number | null = null;
  if (rawDifficulty !== undefined && rawDifficulty !== "") {
    const value = Number(rawDifficulty);
    if (!Number.isSafeInteger(value) || value < 1 || value > 3) {
      return { error: "invalid_difficulty" };
    }
    difficulty = value;
  }
  if (rawMaxCookTime !== undefined && rawMaxCookTime !== "") {
    const value = Number(rawMaxCookTime);
    if (!Number.isSafeInteger(value) || value < 1 || value > 1440) {
      return { error: "invalid_max_cook_time" };
    }
    maxTotalMinutes = value;
  }
  return { filters: { difficulty, maxTotalMinutes } };
}
