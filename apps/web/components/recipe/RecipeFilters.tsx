"use client";

import { clientFetch } from "@/lib/clientApi";
import { ALLERGEN_OPTIONS } from "@/lib/recipeMetadata";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RecipeTagFilter } from "./RecipeTagFilter";

const TIMES = [15, 30, 60] as const;
function numSetting(raw: string, min: number, max: number): string {
  if (!raw.trim()) return "";
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= min && n <= max ? String(n) : "";
}

export function RecipeFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [cuisineError, setCuisineError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await clientFetch("/cuisines", { signal: controller.signal });
        if (!res.ok) throw new Error("cuisines_unavailable");
        const data = await res.json() as { cuisines?: { name: string }[] };
        if (!controller.signal.aborted) {
          setCuisines((data.cuisines ?? []).map(r => r.name).filter(Boolean));
          setCuisineError(false);
        }
      } catch {
        if (!controller.signal.aborted) setCuisineError(true);
      }
    })();
    return () => controller.abort();
  }, []);

  const hasFilters = ["cuisine","difficulty","max_cook_time","tag","q","exclude_allergens","max_calories","min_protein"]
    .some(key => Boolean(sp?.get(key)));
  function navigate(key: string, value: string) {
    const q = new URLSearchParams(sp?.toString());
    if (value) q.set(key, value); else q.delete(key);
    q.delete("page");
    router.push(`/?${q.toString()}#recipe-list-heading`, { scroll: false });
  }
  const [expanded, setExpanded] = useState(() => ["cuisine","tag","exclude_allergens","max_calories","min_protein"]
    .some(key => Boolean(sp?.get(key))));
  const selectedTime = sp?.get("max_cook_time") ?? "";
  const selectedDifficulty = sp?.get("difficulty") ?? "";
  const currentCuisine = sp?.get("cuisine") ?? "";
  const cuisineOptions = currentCuisine && !cuisines.includes(currentCuisine)
    ? [currentCuisine, ...cuisines] : cuisines;

  return (
    <section aria-label="Хоол хайх шүүлтүүр" className="space-y-4 rounded-3xl border border-[#e2eade] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-[#254732]">Хурдан шүүх</h3>
        {hasFilters && <button type="button" onClick={() => router.push("/#recipe-list-heading", { scroll: false })}
          className="text-xs font-semibold text-[#276440] underline underline-offset-4">Шүүлтүүр арилгах</button>}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-600">Хугацаа болон хүндрэл</p>
        <div className="flex flex-wrap gap-2">
          {TIMES.map(t => (
            <button key={t} type="button" aria-pressed={selectedTime === String(t)}
              onClick={() => navigate("max_cook_time", selectedTime === String(t) ? "" : String(t))}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${selectedTime === String(t)
                ? "bg-[#276440] text-white" : "bg-[#edf5e8] text-[#2d6241] hover:bg-[#e1edda]"}`}>
              {t} мин
            </button>
          ))}
          <button type="button" aria-pressed={selectedDifficulty === "1"}
            onClick={() => navigate("difficulty", selectedDifficulty === "1" ? "" : "1")}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ${selectedDifficulty === "1"
              ? "bg-[#276440] text-white" : "bg-[#edf5e8] text-[#2d6241]"}`}>
            Хялбар
          </button>
        </div>
      </div>
      <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)} className="group rounded-2xl border border-[#e5ece2] bg-[#f9fcf7] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#29573c]">Илүү нарийн шүүх · улс, харшил, шим тэжээл</summary>
        <div className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-zinc-700">Улсын хоол
            <select value={currentCuisine} onChange={e => navigate("cuisine", e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-[#dce7d7] bg-white px-3 text-sm font-normal text-zinc-800">
              <option value="">Бүх улсын хоол</option>
              {cuisineOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {cuisineError && <span className="mt-1 block text-[11px] font-normal text-amber-700">Улсын нэрс түр ачаалагдсангүй</span>}
          </label>
          <RecipeTagFilter />
        </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-zinc-700">Харшил үүсгэгч орцуудыг хасах</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALLERGEN_OPTIONS.map(([id,label]) => {
                const selected = new Set((sp?.get("exclude_allergens") ?? "").split(",").filter(Boolean));
                return <label key={id} className="flex min-h-11 items-center gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs">
                  <input type="checkbox" checked={selected.has(id)} className="h-4 w-4 accent-[#276440]"
                    onChange={e => {
                      if (e.target.checked) selected.add(id); else selected.delete(id);
                      navigate("exclude_allergens", [...selected].join(","));
                    }}/>
                  {label}
                </label>;
              })}
            </div>
            <p className="text-xs leading-relaxed text-amber-900">Зөвхөн орцын жагсаалтыг хянасан жорууд харагдана. Бохирдлын эрсдэл, орлуулсан орцыг заавал шалгаарай.</p>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-700">Дээд илчлэг (ккал)
              <input type="number" inputMode="numeric" min="1" max="10000" placeholder="Хязгааргүй"
                key={`cal-${sp?.get("max_calories")}`} defaultValue={sp?.get("max_calories") ?? ""}
                onBlur={e => { const v = numSetting(e.target.value,1,10000);
                  if (v !== (sp?.get("max_calories") ?? "")) navigate("max_calories",v); }}
                className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm" />
            </label>
            <label className="text-xs text-zinc-700">Доод уураг (г)
              <input type="number" inputMode="numeric" min="0" max="1000" placeholder="Хязгааргүй"
                key={`pro-${sp?.get("min_protein")}`} defaultValue={sp?.get("min_protein") ?? ""}
                onBlur={e => { const v = numSetting(e.target.value,0,1000);
                  if (v !== (sp?.get("min_protein") ?? "")) navigate("min_protein",v); }}
                className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm" />
            </label>
          </div>
          <label className="block text-xs text-zinc-700">Хүндрэлийн түвшин
            <select value={selectedDifficulty} onChange={e => navigate("difficulty",e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm">
              <option value="">Бүгд</option>
              <option value="1">Хялбар</option>
              <option value="2">Дунд</option>
              <option value="3">Хэцүү</option>
            </select>
          </label>
        </div>
      </details>
    </section>
  );
}