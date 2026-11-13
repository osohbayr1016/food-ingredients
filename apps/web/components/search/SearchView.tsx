"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeListItem } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const TIME_OPTIONS = [
  { value: "", label: "Бүгд" },
  { value: "15", label: "15 мин" },
  { value: "30", label: "30 мин" },
  { value: "60", label: "60 мин" },
] as const;

type RecipePage = {
  recipes?: RecipeListItem[];
  pagination?: { has_more?: boolean };
};

export function SearchView({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(initialQ);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const activeRequest = useRef("");
  const time = params?.get("max_cook_time") ?? "";
  const easy = params?.get("difficulty") === "1";

  useEffect(() => { setQuery(initialQ); }, [initialQ]);

  const signature = [query.trim(), time, easy ? "easy" : ""].join("|");
  useEffect(() => {
    const controller = new AbortController();
    const key = [query.trim(), time, easy ? "easy" : ""].join("|");
    activeRequest.current = key;
    setLoading(true);
    setFailed(false);
    setMoreError(false);
    setHasMore(false);
    setNextPage(2);
    const timer = setTimeout(async () => {
      try {
        const qs = new URLSearchParams();
        if (query.trim()) qs.set("q", query.trim());
        if (time) qs.set("max_cook_time", time);
        if (easy) qs.set("difficulty", "1");
        const response = await clientFetch(`/recipes?${qs.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search_failed");
        const data = await response.json() as RecipePage;
        if (controller.signal.aborted || activeRequest.current !== key) return;
        setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
        setHasMore(data.pagination?.has_more === true);
      } catch {
        if (!controller.signal.aborted && activeRequest.current === key) {
          setFailed(true);
          setRecipes([]);
        }
      } finally {
        if (!controller.signal.aborted && activeRequest.current === key) setLoading(false);
      }
    }, query.trim() ? 280 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, time, easy, retry]);

  function setUrlPatch(changes: Record<string, string>) {
    const next = new URLSearchParams(params?.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const key = signature;
    const page = nextPage;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const qs = new URLSearchParams({page:String(page)});
      if (query.trim()) qs.set("q", query.trim());
      if (time) qs.set("max_cook_time", time);
      if (easy) qs.set("difficulty", "1");
      const response = await clientFetch(`/recipes?${qs.toString()}`);
      if (!response.ok) throw new Error("pagination_failed");
      const data = await response.json() as RecipePage;
      if (activeRequest.current !== key) return;
      setRecipes(previous => {
        const seen = new Set(previous.map(x => x.id));
        return [...previous, ...(Array.isArray(data.recipes) ? data.recipes : []).filter(x => !seen.has(x.id))];
      });
      setHasMore(data.pagination?.has_more === true);
      setNextPage(page+1);
    } catch {
      if (activeRequest.current === key) setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 py-6 pb-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#203e2c] sm:text-3xl">Жор хайх</h1>
        <p className="text-sm text-[#667c6e]">Хоолны нэр эсвэл орцоо бичээрэй.</p>
      </header>

      <form role="search" onSubmit={event => {event.preventDefault(); setUrlPatch({q:query.trim()});}}
        className="flex items-center gap-2 rounded-2xl border border-[#d9e5d4] bg-white p-2 shadow-[0_4px_20px_rgba(24,58,33,0.04)] focus-within:border-[#6fa17c]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#66826c" strokeWidth="1.8" className="ml-2 shrink-0" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.7"/><path d="m16 16 4 4"/>
        </svg>
        <label className="sr-only" htmlFor="recipe-search">Хоол эсвэл орц хайх</label>
        <input id="recipe-search" value={query} type="search" maxLength={100}
          onChange={event => { setQuery(event.target.value); }}
          placeholder="Тахиа, өндөг, шөл..." autoComplete="off"
          className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-base text-[#213a2b] outline-none placeholder:text-[#91a092]" />
        {query && <button type="button" aria-label="Хайлтыг цэвэрлэх"
          onClick={() => {setQuery("");setUrlPatch({q:""});}}
          className="grid h-11 w-9 shrink-0 place-items-center rounded-lg text-xl text-[#708272] hover:bg-[#f1f5ed]">×</button>}
        <button type="submit" className="min-h-11 shrink-0 rounded-xl bg-[#276440] px-4 text-sm font-bold text-white hover:bg-[#1d5033] sm:px-6">Хайх</button>
      </form>

      <section aria-label="Хурдан шүүх" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-[#6b7f6e]">Хугацаа</span>
          {TIME_OPTIONS.map(option => <button type="button" key={option.value}
            aria-pressed={time === option.value}
            onClick={() => setUrlPatch({max_cook_time:option.value})}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${time === option.value
              ? "bg-[#276440] text-white" : "border border-[#e0e9db] bg-white text-[#366546] hover:bg-[#eff6ea]"}`}>
            {option.label}
          </button>)}
          <button type="button" aria-pressed={easy} onClick={() => setUrlPatch({difficulty:easy ? "" : "1"})}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${easy
              ? "bg-[#276440] text-white" : "border border-[#e0e9db] bg-white text-[#366546] hover:bg-[#eff6ea]"}`}>Хялбар</button>
        </div>
        {(time || easy) && <button type="button" onClick={() => setUrlPatch({max_cook_time:"",difficulty:""})}
          className="min-h-9 text-xs font-semibold text-[#276440] underline underline-offset-4">Шүүлтүүр арилгах</button>}
      </section>

      {loading ? <div role="status" aria-label="Жор хайж байна" className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({length:6},(_,i) => <div key={i} className="overflow-hidden rounded-3xl border border-[#e7ede3] bg-white">
          <div className="aspect-[16/10] animate-pulse bg-[#e8efe3]"/>
          <div className="space-y-2 p-4"><div className="h-4 w-3/4 rounded bg-[#e8efe3]"/><div className="h-3 w-1/2 rounded bg-[#e8efe3]"/></div>
        </div>)}
      </div> : failed ? (
        <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-12 text-center">
          <h2 className="font-bold text-[#563f20]">Жор ачаалж чадсангүй</h2>
          <p className="mt-2 text-sm text-[#75684c]">Интернэт холболтоо шалгаад дахин оролдоорой.</p>
          <button type="button" onClick={() => setRetry(n=>n+1)}
            className="mt-4 min-h-11 rounded-xl bg-[#276440] px-6 text-sm font-semibold text-white">Дахин оролдох</button>
        </div>
      ) : !recipes.length ? (
        <div className="space-y-3 rounded-3xl border border-[#e2e9dc] bg-white px-5 py-12 text-center">
          <h2 className="text-lg font-bold text-[#213d2c]">Тохирох жор олдсонгүй</h2>
          <p className="mx-auto max-w-sm text-sm text-[#6b8071]">Өөр орц бичих эсвэл хугацааны шүүлтүүрээ суллаарай.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => {setQuery("");setUrlPatch({q:"",max_cook_time:"",difficulty:""});}}
              className="min-h-11 rounded-xl bg-[#edf6e8] px-4 text-sm font-semibold text-[#276440]">Бүх жор үзэх</button>
            <Link href="/pantry" className="inline-flex min-h-11 items-center rounded-xl border border-[#d8e5d2] px-4 text-sm font-semibold text-[#276440]">
              Орцоороо хайх
            </Link>
          </div>
        </div>
      ) : <section aria-labelledby="search-results-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="search-results-title" className="text-lg font-bold text-[#203e2c]">
            {query.trim() ? "Тохирох жорууд" : "Сүүлд нэмэгдсэн жорууд"}
          </h2>
          <span role="status" className="text-xs font-medium text-[#738374]">{recipes.length} жор харагдаж байна</span>
        </div>
        <RecipeGrid recipes={recipes}/>
        {hasMore && <button type="button" disabled={loadingMore} onClick={() => void loadMore()}
          className="mx-auto block min-h-12 rounded-xl border border-[#cadfca] bg-white px-6 text-sm font-bold text-[#276440] hover:bg-[#edf6e8] disabled:opacity-50">
          {loadingMore ? "Нэмж ачаалж байна…" : "Илүү жор үзэх"}
        </button>}
        {moreError && <p role="alert" className="text-center text-sm text-amber-800">Дараагийн жорууд ачаалж чадсангүй. Дахин оролдоорой.</p>}
      </section>}
    </main>
  );
}
