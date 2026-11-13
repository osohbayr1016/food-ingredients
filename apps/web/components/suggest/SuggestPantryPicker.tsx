"use client";

import { clientFetch } from "@/lib/clientApi";
import { useCallback, useEffect, useRef, useState } from "react";

type Canon = { canonical_id: string; name: string };

export function SuggestPantryPicker({
  onPick,
  existingIds,
}: {
  onPick: (row: { canonical_id: string; name: string }) => void;
  existingIds: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [hits, setHits] = useState<Canon[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const runSearch = useCallback(async (query: string, signal: AbortSignal) => {
    const searchTerm = query.trim();
    if (!searchTerm) {
      setHits([]);
      setError(false);
      setBusy(false);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const res = await clientFetch(
        `/ingredient-catalog?q=${encodeURIComponent(searchTerm)}`,
        { signal },
      );
      if (!res.ok) throw new Error(`Ingredient search failed: ${res.status}`);
      const data = (await res.json()) as { canonicals?: Canon[] };
      if (!signal.aborted) setHits(data.canonicals ?? []);
    } catch {
      if (!signal.aborted) {
        setHits([]);
        setError(true);
      }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void runSearch(q, controller.signal); }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, runSearch]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <label className="sr-only" htmlFor="pantry-search">
        Орц хайх
      </label>
      <input
        autoComplete="off"
        id="pantry-search"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Орцын нэр бичээд сонго…"
        className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-(--figma-primary) focus:outline-none touch-manipulation"
      />
      {open && (q.trim().length >= 1 || busy) ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-zinc-100 bg-white py-1 shadow-lg">
          {busy ? (
            <li className="px-4 py-3 text-sm text-zinc-500">Хайж байна…</li>
          ) : null}
          {error && !busy ? (
            <li role="alert" className="px-4 py-3 text-sm text-amber-800">Орцын хайлт түр ажиллахгүй байна. Дахин оролдоорой.</li>
          ) : null}
          {!busy && !error && hits.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500">
              Илэрц олдсонгүй
            </li>
          ) : null}
          {hits.map((h) => {
            const disabled = existingIds.has(h.canonical_id);
            return (
              <li key={h.canonical_id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onPick({ canonical_id: h.canonical_id, name: h.name });
                    setQ("");
                    setHits([]);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-800 disabled:opacity-40 touch-manipulation active:bg-zinc-50"
                >
                  {h.name}
                  {disabled ? (
                    <span className="ml-2 text-xs font-normal text-zinc-400">
                      (нэмэгдсэн)
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
