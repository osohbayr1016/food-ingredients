"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeListItem } from "@/lib/types";
import { useEffect, useState } from "react";

const primary = "#276440";

export function SearchView({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    const timer = setTimeout(async () => {
      try {
        const tail = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
        const res = await clientFetch(`/recipes${tail}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = (await res.json()) as { recipes: RecipeListItem[] };
        if (!controller.signal.aborted) setRecipes(data.recipes ?? []);
      } catch {
        if (!controller.signal.aborted) {
          setFailed(true);
          setRecipes([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, q.trim() ? 320 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, retry]);

  function commitSearch(next: string) {
    const t = next.trim();
    const sp = new URLSearchParams(params?.toString());
    if (t) sp.set("q", t);
    else sp.delete("q");
    router.push(`/search${sp.toString() ? `?${sp}` : ""}`);
  }

  return (
    <main className="space-y-4 py-4 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2e7] touch-manipulation"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
        <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#d4e5d0] bg-zinc-50 px-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-zinc-400" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            aria-label="Хоол эсвэл орц хайх"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch(q)}
            placeholder="Хоол эсвэл орц хайх…"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => {
                setQ("");
                commitSearch("");
              }}
              className="shrink-0 p-1 text-zinc-400"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Жор хайж байна">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-3xl border border-zinc-100 bg-white">
              <div className="aspect-[4/3] bg-[#e4ece0]" />
              <div className="space-y-2 p-4"><div className="h-4 w-3/4 rounded bg-[#e4ece0]" /><div className="h-3 w-1/2 rounded bg-[#e4ece0]" /></div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-10 text-center">
          <p className="font-bold text-zinc-900">Хайлтын мэдээлэл ачаалж чадсангүй</p>
          <p className="mt-2 text-sm text-zinc-600">Холболтоо шалгаад дахин оролдоорой.</p>
          <button type="button" onClick={() => setRetry((n) => n + 1)} className="mt-4 rounded-xl bg-[#276440] px-5 py-3 text-sm font-bold text-white">Дахин оролдох</button>
        </div>
      ) : !recipes.length ? (
        <div className="space-y-4 py-12 text-center">
          <p className="text-lg font-bold text-zinc-900">Тохирох жор олдсонгүй</p>
          <p className="mx-auto max-w-sm text-sm text-zinc-500">
            Өөр нэр эсвэл орц хайж үзээрэй.
          </p>
          <Link href="/discover" className="inline-block text-sm font-semibold" style={{ color: primary }}>
            Бүх хоолыг үзэх
          </Link>
        </div>
      ) : (
        <RecipeGrid recipes={recipes} />
      )}
    </main>
  );
}
