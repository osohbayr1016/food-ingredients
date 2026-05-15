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
  const [hits, setHits] = useState<Canon[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    const s = query.trim();
    if (s.length < 1) {
      setHits([]);
      return;
    }
    setBusy(true);
    try {
      const res = await clientFetch(
        `/ingredient-catalog?q=${encodeURIComponent(s)}`,
      );
      const data = (await res.json()) as { canonicals?: Canon[] };
      setHits(data.canonicals ?? []);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => runSearch(q), 220);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
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
          {!busy && hits.length === 0 ? (
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
