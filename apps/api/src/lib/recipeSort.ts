export type RecipeSort = "newest" | "quickest" | "easiest";

/** Only explicitly allowlisted sort keys may influence SQL ORDER BY. */
export function parseRecipeSort(value: string | undefined): RecipeSort | null {
  if (value === undefined || value === "" || value === "newest") return "newest";
  if (value === "quickest" || value === "easiest") return value;
  return null;
}

/** Unknown preparation times always sort last for fastest-first ranking. */
export function recipeSortSql(sort: RecipeSort): string {
  const newest = "COALESCE(pub.published_at,r.created_at) DESC, r.id ASC";
  const knownTime = "CASE WHEN (r.prep_time + r.cook_time) > 0 THEN 0 ELSE 1 END ASC";
  const minutes = "(r.prep_time + r.cook_time) ASC";
  if (sort === "quickest") return `${knownTime}, ${minutes}, ${newest}`;
  if (sort === "easiest") return `r.difficulty ASC, ${knownTime}, ${minutes}, ${newest}`;
  return newest;
}
