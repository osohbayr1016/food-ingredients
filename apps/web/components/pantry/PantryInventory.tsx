"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SuggestPantryPicker } from "@/components/suggest/SuggestPantryPicker";
import { buildSuggestQueryString } from "@/lib/suggestQuery";
import {
  PANTRY_STORAGE_KEY, expiryStatus, normalizePantry, parsePantryStorage,
  todayLocalIso, usablePantry, type PantryInventoryItem,
} from "@/lib/pantryInventory";

export function PantryInventory() {
  const [items, setItems] = useState<PantryInventoryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    try { setItems(parsePantryStorage(localStorage.getItem(PANTRY_STORAGE_KEY))); }
    catch { setError("Хадгалсан орцуудыг уншиж чадсангүй."); }
    setToday(todayLocalIso());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(normalizePantry(items))); }
    catch { setError("Таны browser-д хадгалах зай хүрэлцэхгүй байна."); }
  }, [items, ready]);

  const ids = useMemo(() => new Set(items.map(x => x.canonical_id)), [items]);
  const usable = useMemo(() => usablePantry(items, today), [items, today]);
  const expired = useMemo(() => items.filter(x => expiryStatus(x.expires_on, today) === "expired").length, [items, today]);
  const expiring = useMemo(() => items.filter(x => expiryStatus(x.expires_on, today) === "soon").length, [items, today]);
  const href = "/suggest" + buildSuggestQueryString(usable.map(x => ({
    canonical_id: x.canonical_id, name: x.name, quantity: x.quantity, unit: x.unit,
  })), true, {});

  function patch(id: string, values: Partial<PantryInventoryItem>) {
    setItems(previous => previous.map(row => row.canonical_id === id ? { ...row, ...values } : row));
  }

  return (
    <main className="mx-auto max-w-4xl space-y-7 py-8 pb-24">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#54805b]">Таны гал тогоо</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#23462e]">Миний хөргөгч</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
          Гэрт байгаа орцуудаа нэг удаа оруулаад дараа дахин сонгохгүй ашиглаарай.
          Энэ жагсаалт зөвхөн тухайн төхөөрөмжийн browser-д хадгалагдана.
        </p>
      </header>

      <section className="rounded-3xl border border-[#deeadb] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#254c35]">Орц нэмэх</h2>
          <span className="rounded-full bg-[#e9f5e5] px-3 py-1 text-xs font-bold text-[#356b42]">{items.length}/100 орц</span>
        </div>
        <SuggestPantryPicker
          existingIds={ids}
          onPick={row => {
            if (items.length >= 100 || ids.has(row.canonical_id)) return;
            setItems(previous => [...previous, { ...row, quantity: "", unit: "", expires_on: "" }]);
            setError("");
          }}
        />
        <p className="mt-3 text-xs text-zinc-500">Тоо хэмжээ, нэгж, хэрэглэх огноог хүсвэл бөглөөрэй. Орц тааруулахад тодорхойгүй хэмжээг зохиомлоор тооцохгүй.</p>
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
          <h2 className="text-xl font-bold text-[#254c35]">Миний орцууд</h2>
          {items.length > 0 && <button type="button"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700"
            onClick={() => { if (window.confirm("Хадгалсан бүх орцыг арилгах уу?")) setItems([]); }}>
            Бүгдийг арилгах
          </button>}
        </div>
        {!ready ? <p className="py-4 text-sm text-zinc-500">Ачаалж байна…</p> :
          items.length === 0 ? (
            <p className="rounded-2xl bg-[#f5f9f3] px-5 py-9 text-center text-sm text-zinc-600">Хоосон байна. Дээрх хайлтаар анхны орцоо сонгоорой.</p>
          ) : (
            <ul className="grid gap-3">
              {items.map(item => {
                const status = expiryStatus(item.expires_on, today);
                return <li key={item.canonical_id} className="rounded-2xl border border-[#e4eee0] bg-[#fcfefb] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="min-w-0 font-semibold text-[#264632]">{item.name}</span>
                    <button type="button" onClick={() => setItems(prev => prev.filter(x => x.canonical_id !== item.canonical_id))}
                      className="min-h-10 shrink-0 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700">Арилгах</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                  {status === "expired" && <p className="mt-2 text-xs font-semibold text-rose-700">Оруулсан хугацаа өнгөрсөн — жор санал болгоход ашиглахгүй</p>}
                  {status === "soon" && <p className="mt-2 text-xs font-semibold text-amber-700">Оруулсан хугацаа ойртсон</p>}
                </li>;
              })}
            </ul>
          )}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      </section>

      <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-20 rounded-2xl border border-[#d8e7d5] bg-white/95 p-3 shadow-lg backdrop-blur-sm md:bottom-5">
        {usable.length ? (
          <Link href={href} className="flex min-h-12 items-center justify-center rounded-xl bg-[#286543] px-6 text-center text-sm font-bold text-white hover:bg-[#1e5136]">
            {usable.length} орцоор хоол санал болгох →
          </Link>
        ) : (
          <p className="py-3 text-center text-sm text-zinc-600">Хэрэглэх боломжтой орц нэмбэл жор санал болгоно.</p>
        )}
      </div>
    </main>
  );
}
