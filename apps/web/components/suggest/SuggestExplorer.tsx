"use client";

import { SuggestFeatureIntro } from "@/components/suggest/SuggestFeatureIntro";
import { SuggestPantryScanPanel } from "@/components/suggest/SuggestPantryScanPanel";
import { SuggestPantryPicker } from "@/components/suggest/SuggestPantryPicker";
import { SuggestPantryRow } from "@/components/suggest/SuggestPantryRow";
import { SuggestResultControls } from "@/components/suggest/SuggestResultControls";
import { SuggestResults } from "@/components/suggest/SuggestResults";
import type { SuggestSortKey } from "@/components/suggest/suggestTypes";
import { useSuggestPantryUrl } from "@/components/suggest/useSuggestPantryUrl";
import { useMemo, useState } from "react";

export function SuggestExplorer() {
  const {
    pantry,
    filters,
    busy,
    rows,
    addPick,
    addMultiplePicks,
    addPicksAndSuggest,
    removePick,
    updatePick,
    setFilterPatch,
    suggest,
  } = useSuggestPantryUrl();
  const [sortKey, setSortKey] = useState<SuggestSortKey>("match");
  const existingIds = useMemo(
    () => new Set(pantry.map((p) => p.canonical_id)),
    [pantry],
  );

  return (
    <div className="space-y-4 py-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
          Гар дээрх материал — Pantry match
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">Тохирох жор олох</h1>
        <p className="text-sm text-zinc-500">
          Орцоо бичээд сонго, хэмжээгээ оруулаад шүүлтээ тохируулна. Жорыг бодит
          орцоороор үнэлнэ.
        </p>
      </header>
      <SuggestFeatureIntro />
      <SuggestPantryScanPanel
        onAddPicks={addMultiplePicks}
        onAddPicksAndSuggest={addPicksAndSuggest}
        suggestBusy={busy}
        existingIds={existingIds}
      />
      <SuggestPantryPicker onPick={addPick} existingIds={existingIds} />
      {pantry.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-600">Сонгосон орц</p>
          <ul className="space-y-2">
            {pantry.map((row) => (
              <li key={row.canonical_id}>
                <SuggestPantryRow
                  row={row}
                  onRemove={() => removePick(row.canonical_id)}
                  onQuantity={(v) =>
                    updatePick(row.canonical_id, { quantity: v })
                  }
                  onUnit={(v) => updatePick(row.canonical_id, { unit: v })}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <SuggestResultControls
        filters={filters}
        setFilterPatch={setFilterPatch}
        sortKey={sortKey}
        onSortKey={setSortKey}
      />
      <button
        type="button"
        disabled={busy || !pantry.length}
        onClick={() => suggest()}
        className="w-full rounded-2xl bg-(--figma-primary) py-3 font-semibold text-white disabled:opacity-40 touch-manipulation"
      >
        {busy ? "Тооцоолж байна…" : "Жор санал болгох"}
      </button>
      <SuggestResults rows={rows} sortKey={sortKey} />
    </div>
  );
}
