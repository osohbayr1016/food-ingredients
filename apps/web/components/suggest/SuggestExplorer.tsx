"use client";

import { SuggestFeatureIntro } from "@/components/suggest/SuggestFeatureIntro";
import { SuggestPantryScanPanel } from "@/components/suggest/SuggestPantryScanPanel";
import { SuggestPantryPicker } from "@/components/suggest/SuggestPantryPicker";
import { SuggestPantryRow } from "@/components/suggest/SuggestPantryRow";
import { SuggestResultControls } from "@/components/suggest/SuggestResultControls";
import { SuggestResults } from "@/components/suggest/SuggestResults";
import type { SuggestSortKey } from "@/components/suggest/suggestTypes";
import { useSuggestPantryUrl } from "@/components/suggest/useSuggestPantryUrl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export function SuggestExplorer() {
  const {
    pantry, filters, busy, rows, error,
    addPick, addMultiplePicks, addPicksAndSuggest,
    removePick, updatePick, setFilterPatch, suggest,
  } = useSuggestPantryUrl();
  const params = useSearchParams();
  const [sortKey, setSortKey] = useState<SuggestSortKey>("match");
  const existingIds = useMemo(() => new Set(pantry.map(row => row.canonical_id)),[pantry]);
  const hasRequestedResults = params?.get("r") === "1";
  const unknownAmount = pantry.some(row => !row.quantity.trim() || !row.unit.trim());

  return (
    <main className="mx-auto max-w-4xl space-y-6 py-6 pb-16">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4c8058]">Таны орцоор</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#203e2c] sm:text-3xl">Ямар хоол хийж болох вэ?</h1>
        <p className="text-sm leading-relaxed text-[#687f6e]">
          Орцоо нэмээд жор олоорой. Дутуу орц болон хэмжээний мэдээллийг үр дүнгээс харна.
        </p>
      </header>

      <section aria-labelledby="pick-ingredients-heading" className="space-y-4 rounded-3xl border border-[#e0e9dc] bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="pick-ingredients-heading" className="text-lg font-bold text-[#234932]">Алхам 1 · Орц сонгох</h2>
          <Link href="/pantry" className="text-xs font-semibold text-[#276440] underline underline-offset-4">Миний хөргөгч</Link>
        </div>
        <SuggestPantryPicker existingIds={existingIds} onPick={addPick}/>
        {pantry.length > 0 && <>
          <div className="flex flex-wrap gap-2" aria-label="Сонгосон орцууд">
            {pantry.map(row => <div key={row.canonical_id}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d5e6cc] bg-[#eef7e8] py-1 pl-3.5 pr-1.5 text-sm font-semibold text-[#2a5839]">
              <span>{row.name || "Орц"}</span>
              <button type="button" onClick={() => removePick(row.canonical_id)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#dcebd2]"
                aria-label={`${row.name || "Орц"} хасах`}>×</button>
            </div>)}
          </div>
          <details className="rounded-2xl bg-[#f7faf5] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-[#356b45]">
              Орцын хэмжээ, нэгж тохируулах (сонголтоор)
            </summary>
            <div className="mt-3 space-y-2">
              {pantry.map(row => <SuggestPantryRow key={row.canonical_id} row={row}
                onRemove={() => removePick(row.canonical_id)}
                onQuantity={value => updatePick(row.canonical_id,{quantity:value})}
                onUnit={value => updatePick(row.canonical_id,{unit:value})}/>)}
            </div>
          </details>
        </>}
        {unknownAmount && <p className="text-xs leading-relaxed text-[#8b6630]">
          Хэмжээ бөглөөгүй орцыг хангалттай гэж тооцохгүй. Жороос шаардлагатай хэмжээг шалгаарай.
        </p>}
        <details className="rounded-2xl border border-[#dfe9dc] bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#356b45]">Зурагнаас орц нэмэх (туршилтын)</summary>
          <div className="mt-3 space-y-3">
            <SuggestFeatureIntro/>
            <SuggestPantryScanPanel existingIds={existingIds} suggestBusy={busy}
              onAddPicks={addMultiplePicks} onAddPicksAndSuggest={addPicksAndSuggest}/>
          </div>
        </details>
      </section>

      <section aria-labelledby="suggest-action-heading" className="space-y-3">
        <h2 id="suggest-action-heading" className="text-lg font-bold text-[#234932]">Алхам 2 · Жор олох</h2>
        <button type="button" disabled={busy || pantry.length === 0}
          onClick={() => void suggest()}
          className="min-h-14 w-full rounded-2xl bg-[#276440] px-5 text-base font-bold text-white shadow-[0_8px_20px_rgba(28,85,48,0.13)] transition hover:bg-[#1c4e31] disabled:cursor-not-allowed disabled:opacity-45">
          {busy ? "Тохирох жор хайж байна…" : `${pantry.length} орцоор жор олох`}
        </button>
        {error && <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
        <details className="rounded-2xl border border-[#dfe9dc] bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#356b45]">Нарийвчилсан шүүлтүүр</summary>
          <div className="pt-3">
            <SuggestResultControls filters={filters} setFilterPatch={setFilterPatch}
              sortKey={sortKey} onSortKey={setSortKey}/>
          </div>
        </details>
      </section>

      <section aria-live="polite" className="space-y-4" id="matching-results">
        {busy && <p role="status" className="rounded-2xl bg-[#eef7e8] p-5 text-center text-sm font-semibold text-[#2c6640]">
          Орцуудыг жортой тулгаж байна…
        </p>}
        {!busy && !error && hasRequestedResults && rows.length === 0 &&
          <div className="space-y-2 rounded-3xl border border-[#dfe9dc] bg-white p-8 text-center">
            <h2 className="font-bold text-[#244831]">Одоогоор тохирох жор алга</h2>
            <p className="text-sm text-[#6d8071]">Өөр орц нэмэх эсвэл шүүлтүүрээ суллаарай.</p>
          </div>}
        {!busy && rows.length > 0 && <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#234932]">Тохирох жорууд · {rows.length}</h2>
            <div role="group" aria-label="Жор эрэмбэлэх" className="flex gap-1 rounded-xl bg-[#edf5e8] p-1">
              {([["match","Тааралтаар"],["time","Хугацаагаар"]] as const).map(([key,label]) =>
                <button key={key} type="button" aria-pressed={sortKey === key}
                  onClick={() => setSortKey(key)}
                  className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${sortKey === key ? "bg-white text-[#276440] shadow-sm" : "text-[#6a806c]"}`}>
                  {label}
                </button>)}
            </div>
          </div>
          <SuggestResults rows={rows} sortKey={sortKey} />
        </>}
      </section>
    </main>
  );
}
