import type { SuggestResultRow } from "@/components/suggest/suggestTypes";

/**
 * Pure display filter: "missing ingredients" is distinct from uncertain
 * quantities. We never infer adequate portions from an unknown pantry amount.
 */
export function missingIngredientCount(row: SuggestResultRow): number | null {
  if (typeof row.missing_count === "number" &&
      Number.isSafeInteger(row.missing_count) && row.missing_count >= 0) return row.missing_count;
  if (!Array.isArray(row.ingredients_preview) || !row.ingredients_preview.length) return null;
  return row.ingredients_preview.filter(i => !i.matched || i.quantity_status==="missing").length;
}

export function nearReadyRecipes(rows: SuggestResultRow[], maxMissing=1): SuggestResultRow[] {
  if (!Number.isSafeInteger(maxMissing) || maxMissing < 0) return [];
  return rows.filter(row => {
    const count=missingIngredientCount(row);
    return count !== null && count <= maxMissing;
  });
}
