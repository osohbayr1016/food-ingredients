import { clientFetch } from "@/lib/clientApi";
import { buildSuggestRequestJson } from "@/lib/suggestPayload";
import type { PantryPick, SuggestUrlFilters } from "@/lib/suggestQuery";import type { SuggestResultRow } from "@/components/suggest/suggestTypes";

export async function postSuggestPantryResults(
  pantry: PantryPick[],
  filters: SuggestUrlFilters,
): Promise<SuggestResultRow[]> {
  const payload = buildSuggestRequestJson(pantry, filters);
  const res = await clientFetch("/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Suggest failed");
  const data = (await res.json()) as { results?: SuggestResultRow[] };
  return data.results ?? [];
}
