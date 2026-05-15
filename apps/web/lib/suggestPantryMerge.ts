import type { PantryPick } from "@/lib/suggestQuery";

/** Single URL update avoid stale `pantry` when looping `addPick` in one tick. */
export function mergePantryPicks(
  pantry: PantryPick[],
  newRows: { canonical_id: string; name: string }[],
): PantryPick[] {
  const seen = new Set(pantry.map((p) => p.canonical_id));
  const next = [...pantry];
  for (const r of newRows) {
    const id = String(r.canonical_id ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    next.push({
      canonical_id: id,
      name: String(r.name ?? "").trim() || id,
      quantity: "",
      unit: "",
    });
  }
  return next;
}
