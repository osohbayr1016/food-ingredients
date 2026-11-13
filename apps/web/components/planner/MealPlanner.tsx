"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeDetail, RecipeListItem } from "@/lib/types";
import { aggregateMealShopping, mondayOfWeek, type ShoppingLine } from "@/lib/mealShopping";
import { PANTRY_STORAGE_KEY, parsePantryStorage, todayLocalIso, usablePantry } from "@/lib/pantryInventory";

type Meal = "breakfast" | "lunch" | "dinner";
const DAYS = ["Даваа","Мягмар","Лхагва","Пүрэв","Баасан","Бямба","Ням"];
const MEALS: { id: Meal; title: string }[] = [
  { id: "breakfast", title: "Өглөөний цай" },
  { id: "lunch", title: "Өдрийн хоол" },
  { id: "dinner", title: "Оройн хоол" },
];
const PLAN_KEY = "food-ingredients-week-plan-v2";
const CHECKED_KEY = "food-ingredients-groceries-checked-v2";
const LEGACY_PLAN_KEY = "food-ingredients-week-plan-v1";
/** Public recipe detail cache avoids refetching all 21 slots on every portion edit. */
const recipeDetailCache = new Map<string, { data: RecipeDetail; expires: number }>();
async function getPlannedRecipeDetail(id: string, signal: AbortSignal): Promise<RecipeDetail> {
  const cached = recipeDetailCache.get(id);
  if (cached && cached.expires > Date.now()) return cached.data;
  const response = await clientFetch(`/recipes/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) throw new Error("Recipe fetch failed");
  const data = await response.json() as RecipeDetail;
  recipeDetailCache.set(id, { data, expires: Date.now() + 5 * 60 * 1000 });
  if (recipeDetailCache.size > 100) {
    recipeDetailCache.delete(recipeDetailCache.keys().next().value!);
  }
  return data;
}

export function MealPlanner({ recipes }: { recipes: RecipeListItem[] }) {
  const [offset, setOffset] = useState(0);
  const [localToday, setLocalToday] = useState<Date | null>(null);
  useEffect(() => { setLocalToday(new Date()); }, []);
  const monday = useMemo(() => {
    if (!localToday) return null;
    const d = mondayOfWeek(localToday);
    d.setDate(d.getDate() + offset * 7);
    return d;
  }, [offset, localToday]);
  if (!monday) return <p role="status" className="mx-auto max-w-5xl py-8 text-sm text-zinc-600">7 хоногийн төлөвлөгөө ачаалж байна…</p>;
  const weekStart = todayLocalIso(monday);
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 6);
  return (
    <div className="space-y-4">
      <nav aria-label="7 хоногоо сонгох" className="mx-auto mt-5 flex max-w-5xl items-center justify-between gap-3 rounded-2xl bg-[#edf5e8] p-3 text-sm">
        <button type="button" onClick={() => setOffset(v => v - 1)}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#276440]">← Өмнөх</button>
        <div className="text-center">
          <p className="font-bold text-[#234c34]">{weekStart} – {todayLocalIso(friday)}</p>
          <p className="text-xs text-zinc-600">{offset === 0 ? "Энэ долоо хоног" : offset > 0 ? "Ирэх долоо хоног" : "Өмнөх долоо хоног"}</p>
        </div>
        <button type="button" onClick={() => setOffset(v => v + 1)}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#276440]">Дараах →</button>
      </nav>
      <WeekPlanner key={weekStart} weekStart={weekStart} isCurrent={offset === 0} recipes={recipes}/>
    </div>
  );
}

function WeekPlanner({ recipes, weekStart, isCurrent }: {
  recipes: RecipeListItem[];
  weekStart: string;
  isCurrent: boolean;
}) {
  const planKey = `${PLAN_KEY}:${weekStart}`;
  const checkedKey = `${CHECKED_KEY}:${weekStart}`;
  const portionsKey = `food-ingredients-meal-portions-v1:${weekStart}`;
  const titlesKey = `food-ingredients-meal-titles-v1:${weekStart}`;
  const dateLabels = useMemo(() => DAYS.map((label, i) => {
    const date = new Date(`${weekStart}T12:00:00`);
    date.setDate(date.getDate() + i);
    return `${label} · ${date.getMonth()+1}/${date.getDate()}`;
  }), [weekStart]);
  const [plan, setPlan] = useState<Record<string,string>>({});
  const [checked, setChecked] = useState<Record<string,boolean>>({});
  const [portions, setPortions] = useState<Record<string,number>>({});
  const [titles, setTitles] = useState<Record<string,string>>({});
  const [searchResults, setSearchResults] = useState<RecipeListItem[] | null>(null);
  const [searchResultQuery, setSearchResultQuery] = useState("");
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchNextPage, setSearchNextPage] = useState(2);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchMoreError, setSearchMoreError] = useState(false);
  const currentSearch = useRef(query.trim().toLowerCase());
  const [selectedMeta, setSelectedMeta] = useState<Record<string, { title: string; serves: number }>>({});
  const [searchError, setSearchError] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [day, setDay] = useState(0);
  const [query, setQuery] = useState("");
  const [shopping, setShopping] = useState<ShoppingLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    try {
      const source = localStorage.getItem(planKey) ??
        (isCurrent ? localStorage.getItem(LEGACY_PLAN_KEY) : null);
      const raw: unknown = JSON.parse(source ?? "{}");
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        setPlan(Object.fromEntries(Object.entries(raw).filter(([key,value]) =>
          /^[0-6]\|(breakfast|lunch|dinner)$/.test(key) && typeof value === "string" && value.length < 150)));
      }
    } catch { /* malformed storage becomes an empty plan */ }
    try {
      const raw = JSON.parse(localStorage.getItem(checkedKey) ?? "{}") as Record<string,boolean>;
      if (raw && typeof raw === "object") setChecked(raw);
    } catch { /* ignore */ }
    try {
      const raw = JSON.parse(localStorage.getItem(portionsKey) ?? "{}") as Record<string,number>;
      if (raw && typeof raw === "object") setPortions(raw);
    } catch { /* ignore */ }
    try {
      const raw = JSON.parse(localStorage.getItem(titlesKey) ?? "{}") as Record<string,string>;
      if (raw && typeof raw === "object") setTitles(raw);
    } catch { /* ignore */ }
    setHydrated(true);
  }, [planKey, checkedKey, portionsKey, titlesKey, isCurrent]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(planKey, JSON.stringify(plan)); }
    catch { setStorageWarning(true); }
  }, [hydrated,plan,planKey]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(checkedKey, JSON.stringify(checked)); }
    catch { setStorageWarning(true); }
  }, [hydrated,checked,checkedKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(portionsKey, JSON.stringify(portions));
      localStorage.setItem(titlesKey, JSON.stringify(titles));
    } catch { setStorageWarning(true); }
  }, [hydrated, portions, titles, portionsKey, titlesKey]);

  useEffect(() => {
    const controller = new AbortController();
    const term = query.trim().toLowerCase();
    setSearchResults(null);
    setSearchResultQuery("");
    setSearchHasMore(false);
    setSearchNextPage(2);
    setSearchMoreError(false);
    if (term.length < 2) {
      setSearchBusy(false);
      setSearchError(false);
      return () => controller.abort();
    }
    setSearchBusy(true);
    setSearchError(false);
    const timer = setTimeout(async () => {
      try {
        const res = await clientFetch(`/recipes?q=${encodeURIComponent(term)}&page_size=100`,
          {signal: controller.signal});
        if (!res.ok) throw new Error("recipe_search_failed");
        const data = await res.json() as {
          recipes?: RecipeListItem[]; pagination?: {has_more?:boolean};
        };
        if (!controller.signal.aborted && currentSearch.current === term) {
          setSearchResults(Array.isArray(data.recipes) ? data.recipes : []);
          setSearchResultQuery(term);
          setSearchHasMore(Boolean(data.pagination?.has_more));
        }
      } catch {
        if (!controller.signal.aborted && currentSearch.current === term) {
          setSearchError(true);
          setSearchResults([]);
          setSearchResultQuery(term);
        }
      } finally {
        if (!controller.signal.aborted && currentSearch.current === term) setSearchBusy(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  async function loadMoreSearch() {
    const term = query.trim().toLowerCase();
    if (!searchHasMore || searchLoadingMore || searchResultQuery !== term) return;
    setSearchLoadingMore(true);
    setSearchMoreError(false);
    const page = searchNextPage;
    try {
      const res = await clientFetch(`/recipes?q=${encodeURIComponent(term)}&page_size=100&page=${page}`);
      if (!res.ok) throw new Error("recipe_search_more_failed");
      const data = await res.json() as {recipes?:RecipeListItem[];pagination?:{has_more?:boolean}};
      if (currentSearch.current !== term) return;
      setSearchResults(prev => {
        const seen = new Set((prev ?? []).map(row => row.id));
        return [...(prev ?? []),...(data.recipes ?? []).filter(row => !seen.has(row.id))];
      });
      setSearchNextPage(page+1);
      setSearchHasMore(Boolean(data.pagination?.has_more));
    } catch {
      if (currentSearch.current === term) setSearchMoreError(true);
    } finally {
      setSearchLoadingMore(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const assignments = Object.entries(plan).filter(([,id]) => Boolean(id));
    const distinctIds = [...new Set(assignments.map(([,id]) => id))];
    if (!distinctIds.length) {
      setShopping([]);
      setLoadError(false);
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const details = await Promise.all(distinctIds.map(id => getPlannedRecipeDetail(id,controller.signal)));
        if (!controller.signal.aborted) {
          setSelectedMeta(Object.fromEntries(distinctIds.map((id,i) => [
            id, { title: details[i].recipe.title, serves: Math.max(1,details[i].recipe.serves) },
          ])));
        }
        const detailMap = new Map(distinctIds.map((id,index) => [id,details[index]]));
        let pantry = [] as ReturnType<typeof parsePantryStorage>;
        try { pantry = usablePantry(parsePantryStorage(localStorage.getItem(PANTRY_STORAGE_KEY)),todayLocalIso()); }
        catch { /* manual list remains available */ }
        const requested = assignments.map(([slot,id]) => {
          const detail = detailMap.get(id);
          if (!detail) return null;
          return {
            ingredients: detail.ingredients,
            baseServes: Math.max(1,detail.recipe.serves),
            plannedServes: portions[slot] ?? Math.max(1,detail.recipe.serves),
          };
        }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);
        if (!controller.signal.aborted) setShopping(aggregateMealShopping(requested,pantry));
      } catch {
        if (!controller.signal.aborted) { setLoadError(true); setShopping([]); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [plan,portions,hydrated,retry]);

  const matchingRecipes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (keyword.length >= 2) return searchResultQuery === keyword && searchResults ? searchResults : [];
    return keyword ? recipes.filter(r => r.title.toLowerCase().includes(keyword) || r.cuisine.toLowerCase().includes(keyword)) : recipes;
  }, [query,recipes,searchResults,searchResultQuery]);

  const filled = Object.values(plan).filter(Boolean).length;
  const formatted = (n: number) => Number.isInteger(n) ? String(n) : String(Math.round(n*1000)/1000);

  async function copyShopping() {
    const text = shopping.map(s => `${checked[s.key] ? "✓ " : "□ "}${s.name} — ${formatted(s.quantity)} ${s.unit}`).join("\n");
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch { setCopied(false); }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 py-8 pb-20">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#57845b]">Миний төлөвлөгөө</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#213f2c]">7 хоногийн хоолны төлөвлөгөө</h1>
        <p className="text-sm leading-relaxed text-zinc-600">Өдөрт 3 хоолоо сонгоорой. Орцууд нэгтгэгдэж худалдан авах жагсаалт үүснэ. Таны төлөвлөгөө энэ төхөөрөмж дээр хадгалагдана.</p>
      </header>
      {storageWarning && <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Browser-д хадгалах боломжгүй байна. Та табыг хаахаас өмнө төлөвлөгөөгөө тэмдэглэж аваарай.</p>}
      <section className="space-y-4 rounded-3xl border border-[#e0e9dd] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#214632]">{filled}/21 хоол сонгосон</h2>
          {filled > 0 && <button type="button"
            onClick={() => { if (window.confirm("7 хоногийн төлөвлөгөөг арилгах уу?")) { setPlan({}); setPortions({}); } }}
            className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600">Арилгах</button>}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Өдрөө сонгох">
          {dateLabels.map((d,i) => (
            <button type="button" key={d} aria-pressed={day===i} onClick={()=>setDay(i)}
              className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${day===i ? "bg-[#245d3b] text-white" : "bg-[#edf4e9] text-[#41644b] hover:bg-[#dfebd8]"}`}>
              {d}
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium text-zinc-700">Хоолны нэрээр шүүх
          <input value={query} onChange={e=>{currentSearch.current=e.target.value.trim().toLowerCase();setQuery(e.target.value);}} type="search"
            placeholder="Жишээ: тахиа, шөл..."
            className="mt-2 w-full rounded-xl border border-[#d8e6d5] px-4 py-3 text-sm outline-none focus:border-[#2e7449]" />
        </label>
        {searchBusy && <p role="status" className="text-xs text-zinc-500">Хоол хайж байна…</p>}
        {searchError && <p role="alert" className="text-xs text-amber-800">Хайлтын мэдээлэл ачаалж чадсангүй.</p>}
        {searchHasMore && searchResultQuery === query.trim().toLowerCase() && (
          <button type="button" disabled={searchLoadingMore} onClick={() => void loadMoreSearch()}
            className="min-h-11 rounded-xl border border-[#cde2c8] bg-[#f4faf1] px-4 text-sm font-semibold text-[#276440] disabled:opacity-50">
            {searchLoadingMore ? "Нэмж хайж байна…" : "Дараагийн жоруудыг үзэх"}
          </button>
        )}
        {searchMoreError && <p role="alert" className="text-xs text-amber-800">Нэмэлт жор ачаалж чадсангүй. Дахин оролдоорой.</p>}
        <div className="grid gap-3 md:grid-cols-3">
          {MEALS.map(meal => {
            const key = `${day}|${meal.id}`, chosen = plan[key] ?? "";
            const selectedRecipe = matchingRecipes.find(x => x.id === chosen) ?? recipes.find(x=>x.id===chosen);
            const defaultPortions = Math.max(1,selectedRecipe?.serves ?? selectedMeta[chosen]?.serves ?? 1);
            const servesKnown = !chosen || !!selectedRecipe || !!selectedMeta[chosen];
            return (
              <div key={meal.id} className="rounded-2xl bg-[#f5f9f3] p-4">
                <label className="block text-sm font-bold text-[#31573d]">{meal.title}
                  <select value={chosen} onChange={e => {
                    const id = e.target.value;
                    setPlan(prev => ({...prev,[key]:id}));
                    const found = matchingRecipes.find(r=>r.id===id);
                    if (found) setTitles(prev=>({...prev,[id]:found.title}));
                    setPortions(prev=>{const next={...prev};delete next[key];return next;});
                  }}
                    className="mt-3 min-h-11 w-full rounded-xl border border-[#d7e4d3] bg-white px-3 py-2 text-sm font-normal text-[#293d2e]">
                    <option value="">Хоол сонгох</option>
                    {chosen && !selectedRecipe && <option value={chosen}>{selectedMeta[chosen]?.title ?? titles[chosen] ?? "Өмнө сонгосон жор"}</option>}
                    {matchingRecipes.map(recipe => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}
                  </select>
                </label>
                {chosen && <>
                  <label className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-[#31573d]">
                    Порц
                    <input type="number" min="1" max="30" step="1"
                      value={portions[key] ?? defaultPortions}
                      disabled={!servesKnown}
                      title={!servesKnown ? "Жорын анхны порцыг ачаалж байна" : undefined}
                      onChange={e => {
                        const number = Number(e.target.value);
                        if (Number.isSafeInteger(number) && number >= 1 && number <= 30)
                          setPortions(prev=>({...prev,[key]:number}));
                      }}
                      className="min-h-10 w-20 rounded-lg border border-[#d7e4d3] bg-white px-2 text-right text-sm font-normal" />
                  </label>
                  <a href={`/recipe/${encodeURIComponent(chosen)}`}
                    className="mt-2 inline-block text-xs font-semibold text-[#2f7046] underline">Хийх зааврыг харах</a>
                </>}
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-3xl border border-[#e0e9dd] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold text-[#244834]">Худалдан авах жагсаалт</h2>
            <p className="mt-1 text-xs text-zinc-600">Сонгосон порцоор тооцоолж, хөргөгчинд байгаа хэмжээг боломжтой нэгжээр нь хасна. Тодорхойгүй нэгжүүдийг гараар шалгаарай.</p>
          </div>
          {!!shopping.length && <button type="button" onClick={() => void copyShopping()}
            className="rounded-xl bg-[#275d3d] px-4 py-2 text-xs font-bold text-white">{copied ? "Хууллаа" : "Жагсаалт хуулах"}</button>}
        </div>
        {loading ? <p className="py-6 text-sm text-zinc-500">Орцуудыг нэгтгэж байна…</p> :
         loadError ? <div role="alert" className="py-6 text-sm text-amber-800">Жорын мэдээлэл татаж чадсангүй.
           <button type="button" onClick={() => setRetry(n=>n+1)}
             className="ml-2 font-semibold underline">Дахин оролдох</button>
         </div> :
         !shopping.length ? <p className="py-8 text-sm text-zinc-500">{filled ? "Хөргөгчинд байгаа орц хүрэлцэж байна (мэдэгдэхгүй хэмжээ, нэгжийг шалгаарай)." : "Эхлээд энэ долоо хоногийн хоолоо сонгоорой."}</p> :
         <ul className="mt-5 grid gap-2 sm:grid-cols-2">
           {shopping.map(line=><li key={line.key}>
             <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[#f7f9f5] px-3 py-2 text-sm">
               <input type="checkbox" className="h-4 w-4 accent-emerald-700"
                 checked={Boolean(checked[line.key])}
                 onChange={e=>setChecked(prev=>({...prev,[line.key]:e.target.checked}))} />
               <span className={`min-w-0 flex-1 ${checked[line.key] ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{line.name}</span>
               <span className="shrink-0 font-semibold text-zinc-600">{formatted(line.quantity)} {line.unit}</span>
             </label>
             {line.stockUncertain && <p className="mt-1 pl-3 text-[11px] text-amber-800">Хөргөгчийн нэгж тохироогүй тул хэмжээг гараар шалгана уу.</p>}
           </li>)}
         </ul>}
      </section>
      <p className="text-xs text-zinc-500">Худалдан авахаасаа өмнө жорын порц, хадгалалт, харшил үүсгэгч болон хоолны дуусах хугацааг шалгаарай.</p>
    </main>
  );
}
