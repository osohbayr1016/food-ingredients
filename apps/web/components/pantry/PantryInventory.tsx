"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SuggestPantryPicker } from "@/components/suggest/SuggestPantryPicker";
import { PantryCloudSync } from "@/components/pantry/PantryCloudSync";
import { SuggestPantryScanPanel } from "@/components/suggest/SuggestPantryScanPanel";
import { buildSuggestQueryString } from "@/lib/suggestQuery";
import {
  PANTRY_STORAGE_KEY, expiryStatus, normalizePantry, parsePantryStorage,
  todayLocalIso, usablePantry, type PantryInventoryItem,
} from "@/lib/pantryInventory";

const SELECTED_PANTRY_KEY = "food-ingredients-pantry-selection-v1";

export function PantryInventory() {
  const [items, setItems] = useState<PantryInventoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const existing = parsePantryStorage(localStorage.getItem(PANTRY_STORAGE_KEY));
      setItems(existing);
      const raw = localStorage.getItem(SELECTED_PANTRY_KEY);
      const saved: unknown = raw === null ? existing.slice(0,30).map(item => item.canonical_id) : JSON.parse(raw);
      const allowed = new Set(existing.map(item => item.canonical_id));
      setSelectedIds(new Set(Array.isArray(saved)
        ? saved.filter((id): id is string => typeof id === "string" && allowed.has(id)).slice(0,30)
        : existing.slice(0,30).map(item => item.canonical_id)));
    } catch { setError("Хадгалсан орцуудыг уншиж чадсангүй."); }
    setToday(todayLocalIso());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(normalizePantry(items))); }
    catch { setError("Таны browser-д хадгалах зай хүрэлцэхгүй байна."); }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(SELECTED_PANTRY_KEY,JSON.stringify([...selectedIds])); }
    catch { setError("Сонголтыг хадгалах боломжгүй байна."); }
  }, [ready,selectedIds]);
  const ids = useMemo(() => new Set(items.map(x => x.canonical_id)), [items]);
  const usable = useMemo(() => usablePantry(items, today), [items, today]);
  const expired = useMemo(() => items.filter(x => expiryStatus(x.expires_on, today) === "expired").length, [items, today]);
  const expiring = useMemo(() => items.filter(x => expiryStatus(x.expires_on, today) === "soon").length, [items, today]);
  const matchingItems = usable.filter(item => selectedIds.has(item.canonical_id)).slice(0,30);
  function toggleSelection(id: string) {
    const active = new Set(usable.map(item => item.canonical_id));
    setSelectedIds(prev => {
      // Expired/removed items must not block a valid 30-slot selection.
      const next = new Set([...prev].filter(itemId => active.has(itemId)));
      if (next.has(id)) next.delete(id);
      else if (active.has(id) && next.size < 30) next.add(id);
      return next;
    });
  }
  const href = "/suggest" + buildSuggestQueryString(matchingItems.map(x => ({
    canonical_id: x.canonical_id, name: x.name, quantity: x.quantity, unit: x.unit,
  })), true, {});

  function patch(id: string, values: Partial<PantryInventoryItem>) {
    setItems(previous => previous.map(row => row.canonical_id === id ? { ...row, ...values } : row));
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 py-6 pb-24 sm:space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#54805b]">Алхам 1 · Орцоо нэмэх</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#23462e]">Байгаа орцоороо хоол олох</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
          Гэртээ байгаа зүйлсээ нэмээд, аль орцоор хоол хийхээ сонгоорой.
          Орцууд зөвхөн энэ төхөөрөмж дээр хадгалагдана.
        </p>
      </header>

      <details className="rounded-2xl border border-[#dfe9dc] bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#276440]">
          Утас, компьютерийн орцоо синк хийх (бүртгэлтэй үед)
        </summary>
        <div className="pt-4">
          <PantryCloudSync items={items} onRestore={(restored) => {
            setItems(restored);
            setSelectedIds(new Set(restored.slice(0,30).map(item => item.canonical_id)));
          }} />
        </div>
      </details>

      <section className="rounded-3xl border border-[#deeadb] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#254c35]">Ямар орц байна?</h2>
          <span className="rounded-full bg-[#e9f5e5] px-3 py-1 text-xs font-bold text-[#356b42]">{items.length}/100 орц</span>
        </div>
        <SuggestPantryPicker
          existingIds={ids}
          onPick={row => {
            if (items.length >= 100 || ids.has(row.canonical_id)) return;
            setItems(previous => [...previous, { ...row, quantity: "", unit: "", expires_on: "" }]);
            setSelectedIds(previous => previous.size >= 30 ? previous : new Set(previous).add(row.canonical_id));
            setError("");
          }}
        />
        <p className="mt-3 text-xs text-zinc-500">Хэмжээг мэдэхгүй бол хоосон үлдээж болно. Жор тааруулахдаа хэмжээг баталгаатай гэж үзэхгүй.</p>
        <details className="mt-5 rounded-2xl border border-[#e2eae0] bg-[#f7faf5] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#276440]">Зургаар орц нэмэх (туршилтын)</summary>
          <div className="mt-3">
            <SuggestPantryScanPanel existingIds={ids} onAddPicks={rows => {
              const seen = new Set(ids);
              const additions = rows.filter(row => {
                if (seen.has(row.canonical_id)) return false;
                seen.add(row.canonical_id);
                return true;
              }).slice(0, Math.max(0,100-items.length));
              setItems(previous => [...previous,...additions.map(row => ({
                ...row, quantity: "", unit: "", expires_on: "",
              }))].slice(0,100));
              setSelectedIds(previous => {
                const next = new Set(previous);
                for (const row of additions) {
                  if (next.size >= 30) break;
                  next.add(row.canonical_id);
                }
                return next;
              });
            }} />
          </div>
        </details>
      </section>

      {(expiring > 0 || expired > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950" role="status">
          {expired > 0 ? `${expired} орцны оруулсан огноо өнгөрсөн. ` : ""}
          {expiring > 0 ? `${expiring} орцны оруулсан огноо ойртсон.` : ""}
          <p className="mt-2 text-xs">Эндэх огноо нь хадгалалтын аюулгүй байдлын баталгаа биш. Хүнсний савлагаа, нөхцөл, үнэр, өнгө, хэрэглэх хугацааг заавал шалгаарай.</p>
        </div>
      )}

      <section className="space-y-4 rounded-3xl border border-[#deeadb] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#254c35]">Алхам 2 · Хийх орцоо сонгох</h2>
          {items.length > 0 && <button type="button"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700"
            onClick={() => { if (window.confirm("Хадгалсан бүх орцыг арилгах уу?")) {setItems([]);setSelectedIds(new Set());} }}>
            Бүгдийг арилгах
          </button>}
        </div>
        {items.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#edf6e8] p-3">
          <span className="text-sm font-semibold text-[#276440]">Хоолонд ашиглах: {matchingItems.length}/30</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelectedIds(new Set(usable.slice(0,30).map(x => x.canonical_id)))}
              className="min-h-10 rounded-lg bg-white px-3 text-xs font-semibold text-[#276440]">Бүгдээс сонгох</button>
            <button type="button" onClick={() => setSelectedIds(new Set())}
              className="min-h-10 rounded-lg border border-[#cde0c8] px-3 text-xs font-semibold text-[#276440]">Сонголт цэвэрлэх</button>
          </div>
        </div>}
        {!ready ? <p className="py-4 text-sm text-zinc-500">Ачаалж байна…</p> :
          items.length === 0 ? (
            <p className="rounded-2xl bg-[#f5f9f3] px-5 py-9 text-center text-sm text-zinc-600">Жагсаалт хоосон байна. Дээрээс эхний орцоо нэмээрэй.</p>
          ) : (
            <ul className="grid gap-3">
              {items.map(item => {
                const status = expiryStatus(item.expires_on, today);
                return <li key={item.canonical_id} className="rounded-2xl border border-[#e4eee0] bg-[#fcfefb] p-3.5 sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="flex min-w-0 items-center gap-3 text-sm font-semibold text-[#264632]">
                      <input type="checkbox" checked={selectedIds.has(item.canonical_id)}
                        disabled={(!selectedIds.has(item.canonical_id) && (status === "expired" || matchingItems.length >= 30))}
                        onChange={() => toggleSelection(item.canonical_id)}
                        aria-label={`${item.name} жор тааруулахад ашиглах`}
                        className="h-5 w-5 shrink-0 accent-[#276440]"/>
                      <span className="min-w-0">{item.name}</span>
                    </label>
                    <button type="button" onClick={() => {
                      setItems(prev => prev.filter(x => x.canonical_id !== item.canonical_id));
                      setSelectedIds(prev => {const n=new Set(prev);n.delete(item.canonical_id);return n;});
                    }}
                      className="min-h-10 shrink-0 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700">Арилгах</button>
                  </div>
                  <details className="group rounded-xl bg-[#f3f8f0] px-3 py-2.5">
                    <summary className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-xs font-semibold text-[#3b6a4b]">
                      <span>{item.quantity && item.unit ? `${item.quantity} ${item.unit}` : "Хэмжээ, огноо нэмэх (сонголтоор)"}
                        {item.expires_on ? ` · ${item.expires_on}` : ""}
                      </span>
                      <span aria-hidden="true" className="text-lg leading-none transition group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3">
                      <label className="text-xs text-zinc-600">Хэмжээ
                        <input type="number" min="0.01" max="100000" step="any" inputMode="decimal" value={item.quantity}
                          onChange={e=>patch(item.canonical_id,{quantity:e.target.value})}
                          placeholder="Тодорхойгүй"
                          className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm" />
                      </label>
                      <label className="text-xs text-zinc-600">Нэгж
                        <input value={item.unit} maxLength={40} onChange={e=>patch(item.canonical_id,{unit:e.target.value})}
                          placeholder="г / кг / ш..."
                          className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm" />
                      </label>
                      <label className="col-span-2 text-xs text-zinc-600 sm:col-span-1">Хэрэглэх огноо
                        <input type="date" value={item.expires_on} onChange={e=>patch(item.canonical_id,{expires_on:e.target.value})}
                          className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm" />
                      </label>
                    </div>
                  </details>
                  {status === "expired" && <p className="mt-2 text-xs font-semibold text-rose-700">Оруулсан хугацаа өнгөрсөн — жор санал болгоход ашиглахгүй</p>}
                  {status === "soon" && <p className="mt-2 text-xs font-semibold text-amber-700">Оруулсан хугацаа ойртсон</p>}
                </li>;
              })}
            </ul>
          )}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      </section>

      <div className="sticky bottom-[calc(88px+env(safe-area-inset-bottom))] z-20 rounded-2xl border border-[#d8e7d5] bg-white/95 p-3 shadow-lg backdrop-blur-sm lg:bottom-5">
        {usable.length > 30 && <p className="mb-2 text-center text-xs text-amber-800">Жор тааруулах 30 орцоо дээрх жагсаалтаас хүссэнээрээ сонгоно уу. Бусад орц хадгалагдана.</p>}
        <p className="mb-2 text-center text-xs font-semibold text-[#63836b]">Алхам 3 · Тохирох жор олох</p>
        {matchingItems.length ? (
          <Link href={href} className="flex min-h-12 items-center justify-center rounded-xl bg-[#286543] px-6 text-center text-sm font-bold text-white hover:bg-[#1e5136]">
            {matchingItems.length} орцоор жор олох
          </Link>
        ) : (
          <p className="py-3 text-center text-sm text-zinc-600">Хэрэглэх боломжтой орц нэмбэл жор санал болгоно.</p>
        )}
      </div>
    </main>
  );
}
