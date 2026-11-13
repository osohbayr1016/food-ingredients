"use client";

import { clientFetch } from "@/lib/clientApi";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type CanonicalIngredient = { canonical_id: string; name: string };

export function SuggestPantryPicker({
  onPick, existingIds,
}: {
  onPick: (row: CanonicalIngredient) => void;
  existingIds: Set<string>;
}) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [hits, setHits] = useState<CanonicalIngredient[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const root = useRef<HTMLDivElement>(null);

  const search = useCallback(async (term: string, signal: AbortSignal) => {
    if (!term.trim()) {
      setHits([]);
      setError(false);
      setBusy(false);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const response = await clientFetch(
        `/ingredient-catalog?q=${encodeURIComponent(term.trim())}`,{signal},
      );
      if (!response.ok) throw new Error("ingredient_catalog_unavailable");
      const data = await response.json() as { canonicals?: CanonicalIngredient[] };
      if (!signal.aborted) {
        setHits(Array.isArray(data.canonicals) ? data.canonicals : []);
        setActiveIndex(-1);
      }
    } catch {
      if (!signal.aborted) { setHits([]); setError(true); }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  },[]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void search(query,controller.signal),220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  },[query,search]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown",onOutsideClick);
    return () => document.removeEventListener("pointerdown",onOutsideClick);
  },[]);

  function pick(row: CanonicalIngredient) {
    if (existingIds.has(row.canonical_id)) return;
    onPick(row);
    setQuery("");
    setHits([]);
    setActiveIndex(-1);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || !hits.length || busy) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      for (let step=0;step<hits.length;step++) {
        const next = ((activeIndex+direction*(step+1))%hits.length+hits.length)%hits.length;
        if (!existingIds.has(hits[next].canonical_id)) {
          setActiveIndex(next);
          break;
        }
      }
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(hits[activeIndex]);
    }
  }

  const visible = open && (Boolean(query.trim()) || busy);
  return <div ref={root} className="relative">
    <label htmlFor={inputId} className="sr-only">Орцын нэр хайх</label>
    <div className="flex items-center gap-2 rounded-2xl border-2 border-[#dce7d8] bg-white px-3 focus-within:border-[#7fac82]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#77927b" strokeWidth="1.8" className="shrink-0" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.6"/><path d="m16 16 4 4"/>
      </svg>
      <input id={inputId} type="search" autoComplete="off" role="combobox"
        aria-autocomplete="list" aria-expanded={visible}
        aria-controls={visible ? listId : undefined}
        aria-activedescendant={visible && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        value={query} onChange={event => {setQuery(event.target.value);setActiveIndex(-1);setOpen(true);}}
        onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
        placeholder="Жишээ нь: төмс, өндөг, тахиа"
        className="min-h-12 w-full min-w-0 bg-transparent py-3 text-base text-[#264633] outline-none placeholder:text-[#849487]" />
    </div>
    {visible && <ul id={listId} role="listbox" aria-label="Орцын санал"
      className="absolute inset-x-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#dfe9dc] bg-white py-1 shadow-[0_15px_35px_rgba(21,61,42,0.12)]">
      {busy && <li role="presentation" className="px-4 py-3 text-sm text-[#667b6b]">Орц хайж байна…</li>}
      {!busy && error && <li role="presentation" className="px-4 py-3 text-sm text-amber-900" aria-live="polite">
        Орц ачаалж чадсангүй. Хайлтаа дахин бичиж үзээрэй.
      </li>}
      {!busy && !error && hits.length === 0 && <li role="presentation" className="px-4 py-3 text-sm text-[#778779]">
        Орц олдсонгүй. Өөр нэрээр хайж үзээрэй.
      </li>}
      {!busy && hits.map((item,index) => {
        const disabled = existingIds.has(item.canonical_id);
        return <li key={item.canonical_id} role="presentation">
          <button type="button" role="option" id={`${listId}-option-${index}`}
            aria-selected={activeIndex === index} disabled={disabled}
            onMouseEnter={() => setActiveIndex(index)} onClick={() => pick(item)}
            className={`flex min-h-11 w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-colors ${activeIndex === index ? "bg-[#eaf4e6]" : "hover:bg-[#f5f8f1]"} ${disabled ? "cursor-not-allowed text-[#9ba99a]" : "text-[#254d34]"}`}>
            <span>{item.name}</span>
            <span className="ml-2 shrink-0 text-xs">{disabled ? "Нэмэгдсэн" : "+"}</span>
          </button>
        </li>;
      })}
    </ul>}
  </div>;
}
