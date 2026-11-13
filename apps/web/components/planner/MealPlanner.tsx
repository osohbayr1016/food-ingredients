"use client";

import { useEffect, useMemo, useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeDetail, RecipeListItem } from "@/lib/types";

type Meal = "breakfast" | "lunch" | "dinner";
type ShoppingLine = { key: string; name: string; quantity: number; unit: string };
const DAYS = ["Даваа","Мягмар","Лхагва","Пүрэв","Баасан","Бямба","Ням"];
const MEALS: { id: Meal; title: string }[] = [
  { id: "breakfast", title: "Өглөөний цай" },
  { id: "lunch", title: "Өдрийн хоол" },
  { id: "dinner", title: "Оройн хоол" },
];
const PLAN_KEY = "food-ingredients-week-plan-v1";
const CHECKED_KEY = "food-ingredients-groceries-checked-v1";

export function MealPlanner({ recipes }: { recipes: RecipeListItem[] }) {
  const [plan, setPlan] = useState<Record<string,string>>({});
  const [checked, setChecked] = useState<Record<string,boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [day, setDay] = useState(0);
  const [query, setQuery] = useState("");
  const [shopping, setShopping] = useState<ShoppingLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "{}") as unknown;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const safe = Object.fromEntries(Object.entries(raw).filter(([key,value]) =>
          /^\d\|(breakfast|lunch|dinner)$/.test(key) && typeof value === "string"));
        setPlan(safe);
      }
    } catch { /* malformed storage becomes an empty plan */ }
    try {
      const raw = JSON.parse(localStorage.getItem(CHECKED_KEY) ?? "{}") as Record<string,boolean>;
      if (raw && typeof raw === "object") setChecked(raw);
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }, [hydrated,plan]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(CHECKED_KEY, JSON.stringify(checked));
  }, [hydrated,checked]);

  useEffect(() => {
    const controller = new AbortController();
    const counts = new Map<string,number>();
    for (const id of Object.values(plan)) {
      if (id) counts.set(id,(counts.get(id) ?? 0)+1);
    }
    if (!counts.size) {
      setShopping([]);
      setLoadError(false);
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const distinct = [...counts.keys()];
        const details = await Promise.all(distinct.map(async id => {
          const response = await clientFetch(`/recipes/${encodeURIComponent(id)}`, {signal:controller.signal});
          if (!response.ok) throw new Error("Recipe fetch failed");
          return await response.json() as RecipeDetail;
        }));
        const rows = new Map<string,ShoppingLine>();
        for (let i=0;i<distinct.length;i++) {
          const detail = details[i], repetitions = counts.get(distinct[i]) ?? 1;
          for (const ingredient of detail.ingredients) {
            const name = ingredient.name.trim();
            const unit = ingredient.unit.trim();
            if (!name) continue;
            const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
            const existing = rows.get(key);
            if (existing) existing.quantity += ingredient.quantity*repetitions;
            else rows.set(key,{key,name,unit,quantity:ingredient.quantity*repetitions});
          }
        }
        if (!controller.signal.aborted) setShopping([...rows.values()].sort((a,b) => a.name.localeCompare(b.name,"mn")));
      } catch {
        if (!controller.signal.aborted) { setLoadError(true); setShopping([]); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [plan]);

  const matchingRecipes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return keyword ? recipes.filter(r => r.title.toLowerCase().includes(keyword) || r.cuisine.toLowerCase().includes(keyword)) : recipes;
  }, [query,recipes]);

  const filled = Object.values(plan).filter(Boolean).length;
  const formatted = (n: number) => Number.isInteger(n) ? String(n) : String(Math.round(n*100)/100);

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
      <section className="space-y-4 rounded-3xl border border-[#e0e9dd] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#214632]">{filled}/21 хоол сонгосон</h2>
          {filled > 0 && <button type="button"
            onClick={() => { if (window.confirm("7 хоногийн төлөвлөгөөг арилгах уу?")) setPlan({}); }}
            className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600">Арилгах</button>}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Өдрөө сонгох">
          {DAYS.map((d,i) => (
            <button type="button" key={d} aria-pressed={day===i} onClick={()=>setDay(i)}
              className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${day===i ? "bg-[#245d3b] text-white" : "bg-[#edf4e9] text-[#41644b] hover:bg-[#dfebd8]"}`}>
              {d}
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium text-zinc-700">Хоолны нэрээр шүүх
          <input value={query} onChange={e=>setQuery(e.target.value)} type="search"
            placeholder="Жишээ: тахиа, шөл..."
            className="mt-2 w-full rounded-xl border border-[#d8e6d5] px-4 py-3 text-sm outline-none focus:border-[#2e7449]" />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          {MEALS.map(meal => {
            const key = `${day}|${meal.id}`, chosen = plan[key] ?? "";
            const options = matchingRecipes.some(x=>x.id===chosen) ? matchingRecipes :
              [...recipes.filter(x=>x.id===chosen),...matchingRecipes];
            return (
              <label key={meal.id} className="block rounded-2xl bg-[#f5f9f3] p-4">
                <span className="text-sm font-bold text-[#31573d]">{meal.title}</span>
                <select value={chosen} onChange={e => setPlan(prev=>({...prev,[key]:e.target.value}))}
                  className="mt-3 min-h-11 w-full rounded-xl border border-[#d7e4d3] bg-white px-3 py-2 text-sm text-[#293d2e]">
                  <option value="">Хоол сонгох</option>
                  {options.map(recipe => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}
                </select>
                {chosen && <a href={`/recipe/${encodeURIComponent(chosen)}`}
                  className="mt-2 inline-block text-xs font-semibold text-[#2f7046] underline">Хийх зааврыг харах</a>}
              </label>
            );
          })}
        </div>
      </section>
      <section className="rounded-3xl border border-[#e0e9dd] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold text-[#244834]">Худалдан авах жагсаалт</h2>
            <p className="mt-1 text-xs text-zinc-600">Сонгосон жоруудын бүх орц. Нэгж өөр бол тусдаа мөрөнд гарна.</p>
          </div>
          {!!shopping.length && <button type="button" onClick={() => void copyShopping()}
            className="rounded-xl bg-[#275d3d] px-4 py-2 text-xs font-bold text-white">{copied ? "Хууллаа" : "Жагсаалт хуулах"}</button>}
        </div>
        {loading ? <p className="py-6 text-sm text-zinc-500">Орцуудыг нэгтгэж байна…</p> :
         loadError ? <p role="alert" className="py-6 text-sm text-amber-800">Жорын мэдээлэл татаж чадсангүй. Холболтоо шалгаарай.</p> :
         !shopping.length ? <p className="py-8 text-sm text-zinc-500">Эхлээд энэ долоо хоногийн хоолоо сонгоорой.</p> :
         <ul className="mt-5 grid gap-2 sm:grid-cols-2">
           {shopping.map(line=><li key={line.key}>
             <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[#f7f9f5] px-3 py-2 text-sm">
               <input type="checkbox" className="h-4 w-4 accent-emerald-700"
                 checked={Boolean(checked[line.key])}
                 onChange={e=>setChecked(prev=>({...prev,[line.key]:e.target.checked}))} />
               <span className={`min-w-0 flex-1 ${checked[line.key] ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{line.name}</span>
               <span className="shrink-0 font-semibold text-zinc-600">{formatted(line.quantity)} {line.unit}</span>
             </label>
           </li>)}
         </ul>}
      </section>
      <p className="text-xs text-zinc-500">Худалдан авахаасаа өмнө жорын порц, хадгалалт, харшил үүсгэгч болон хоолны дуусах хугацааг шалгаарай.</p>
    </main>
  );
}
