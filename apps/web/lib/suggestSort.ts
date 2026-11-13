import type { SuggestResultRow, SuggestSortKey } from "@/components/suggest/suggestTypes";

export function sortSuggestRows(
  rows: SuggestResultRow[],
  key: SuggestSortKey,
): SuggestResultRow[] {
  const copy = [...rows];
  switch (key) {
    case "time":
      return copy.sort((a, b) => {
        const aTime = a.prep_time + a.cook_time;
        const bTime = b.prep_time + b.cook_time;
        // Imported unknown durations are stored as zero; never rank them as instant meals.
        return (aTime > 0 ? aTime : Number.POSITIVE_INFINITY) -
          (bTime > 0 ? bTime : Number.POSITIVE_INFINITY);
      });
    case "difficulty":
      return copy.sort((a, b) => a.difficulty - b.difficulty);
    case "serves":
      return copy.sort((a, b) => a.serves - b.serves);
    default:
      return copy.sort(
        (a, b) =>
          b.match_ratio - a.match_ratio ||
          b.matched_count - a.matched_count,
      );
  }
}
