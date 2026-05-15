"use client";

import type { SuggestSortKey } from "@/components/suggest/suggestTypes";
import type { SuggestUrlFilters } from "@/lib/suggestQuery";

export function SuggestResultControls({
  filters,
  setFilterPatch,
  sortKey,
  onSortKey,
}: {
  filters: SuggestUrlFilters;
  setFilterPatch: (patch: Partial<SuggestUrlFilters>) => void;
  sortKey: SuggestSortKey;
  onSortKey: (k: SuggestSortKey) => void;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Шүүлт (жорын дээр хэрэгжинэ)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-zinc-600">
          Дээд нийт хугацаа (мин)
          <input
            key={`tmax-${filters.max_total_minutes ?? "-"}`}
            type="number"
            min={0}
            defaultValue={filters.max_total_minutes ?? ""}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              if (raw === "") {
                setFilterPatch({ max_total_minutes: undefined });
                return;
              }
              const n = Number(raw);
              setFilterPatch({
                max_total_minutes: Number.isFinite(n) ? n : undefined,
              });
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm touch-manipulation"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Дээд хэцүү байдал
          <select
            value={
              filters.max_difficulty != null
                ? String(filters.max_difficulty)
                : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              setFilterPatch({
                max_difficulty:
                  v === "" ? undefined : Number(v),
              });
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm touch-manipulation"
          >
            <option value="">Хязгааргүй</option>
            <option value="1">1 — хялбар</option>
            <option value="2">2 — дунд</option>
            <option value="3">3 — хэцүү</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Доод хүний тоо (serves)
          <input
            key={`smin-${filters.min_serves ?? "-"}`}
            type="number"
            min={1}
            defaultValue={filters.min_serves ?? ""}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              if (raw === "") {
                setFilterPatch({ min_serves: undefined });
                return;
              }
              const n = Number(raw);
              setFilterPatch({
                min_serves: Number.isFinite(n) ? n : undefined,
              });
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm touch-manipulation"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Дээд хүний тоо (serves)
          <input
            key={`smax-${filters.max_serves ?? "-"}`}
            type="number"
            min={1}
            defaultValue={filters.max_serves ?? ""}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              if (raw === "") {
                setFilterPatch({ max_serves: undefined });
                return;
              }
              const n = Number(raw);
              setFilterPatch({
                max_serves: Number.isFinite(n) ? n : undefined,
              });
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm touch-manipulation"
          />
        </label>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600">
          Үр дүн эрэмбэлэх
          <select
            value={sortKey}
            onChange={(e) => onSortKey(e.target.value as SuggestSortKey)}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm touch-manipulation"
          >
            <option value="match">Тааруулалтын хувь</option>
            <option value="time">Хугацаа (богино эхэлнэ)</option>
            <option value="difficulty">Хэцүү байдал (хялбар эхэлнэ)</option>
            <option value="serves">Хүний тоо</option>
          </select>
        </label>
      </div>
    </section>
  );
}
