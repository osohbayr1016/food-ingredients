"use client";

import type { PantryScanHit } from "@/lib/pantryImage/runPantryImageScan";

export function SuggestPantryScanHitRows({
  hits,
  selected,
  existingIds,
  onToggle,
}: {
  hits: PantryScanHit[];
  selected: Set<string>;
  existingIds: Set<string>;
  onToggle: (canonicalId: string) => void;
}) {
  return (
    <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl bg-zinc-50 p-2">
      {hits.map((h) => (
        <li key={h.canonical_id}>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(h.canonical_id)}
              disabled={existingIds.has(h.canonical_id)}
              onChange={() => onToggle(h.canonical_id)}
              className="rounded border-zinc-300"
            />
            <span className={existingIds.has(h.canonical_id) ? "text-zinc-400" : ""}>
              {h.name}{" "}
              <span className="tabular-nums text-zinc-400">
                {(h.score * 100).toFixed(1)}%
              </span>
              <span className="ml-1 text-xs text-zinc-400">(≈1)</span>
              {existingIds.has(h.canonical_id) ? " — аль хэдийн" : ""}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
