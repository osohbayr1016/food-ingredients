import type { PantryPick, SuggestUrlFilters } from "@/lib/suggestQuery";

export function suggestStateSig(
  pantry: PantryPick[],
  filters: SuggestUrlFilters,
) {
  return JSON.stringify({ pantry, filters });
}

export function pantryPostBody(pantry: PantryPick[]) {
  return pantry.map((p) => {
    const q = p.quantity.trim();
    const qty =
      q === "" || Number.isNaN(Number(q)) ? undefined : Number(q);
    return {
      canonical_id: p.canonical_id,
      name: p.name.trim(),
      quantity: qty,
      unit: p.unit.trim(),
    };
  });
}

export function filtersPostBody(
  f: SuggestUrlFilters,
): Record<string, number> | undefined {
  const o: Record<string, number> = {};
  if (f.max_total_minutes != null) o.max_total_minutes = f.max_total_minutes;
  if (f.max_difficulty != null) o.max_difficulty = f.max_difficulty;
  if (f.min_serves != null) o.min_serves = f.min_serves;
  if (f.max_serves != null) o.max_serves = f.max_serves;
  return Object.keys(o).length ? o : undefined;
}

export function buildSuggestRequestJson(
  pantry: PantryPick[],
  filters: SuggestUrlFilters,
): Record<string, unknown> {
  const fil = filtersPostBody(filters);
  const base: Record<string, unknown> = {
    pantry: pantryPostBody(pantry),
  };
  if (fil) base.filters = fil;
  return base;
}
