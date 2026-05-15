"use client";

import type { PantryPick } from "@/lib/suggestQuery";

export function SuggestPantryRow({
  row,
  onRemove,
  onQuantity,
  onUnit,
}: {
  row: PantryPick;
  onRemove: () => void;
  onQuantity: (v: string) => void;
  onUnit: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-3 sm:flex-row sm:items-end sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {row.name || row.canonical_id}
        </p>
        <p className="truncate text-xs text-zinc-400">{row.canonical_id}</p>
      </div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`qty-${row.canonical_id}`}>
          Тоо
        </label>
        <input
          id={`qty-${row.canonical_id}`}
          type="text"
          inputMode="decimal"
          value={row.quantity}
          onChange={(e) => onQuantity(e.target.value)}
          placeholder="Тоо"
          className="w-20 rounded-xl border border-zinc-200 px-2 py-2 text-sm tabular-nums touch-manipulation"
        />
        <label className="sr-only" htmlFor={`unit-${row.canonical_id}`}>
          Нэгж
        </label>
        <input
          id={`unit-${row.canonical_id}`}
          type="text"
          value={row.unit}
          onChange={(e) => onUnit(e.target.value)}
          placeholder="г, ш, амт"
          className="w-24 rounded-xl border border-zinc-200 px-2 py-2 text-sm touch-manipulation"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 touch-manipulation active:bg-rose-100"
      >
        Хасах
      </button>
    </div>
  );
}
