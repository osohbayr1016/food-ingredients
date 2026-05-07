"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeListItem } from "@/lib/types";
import { useEffect, useState } from "react";

const primary = "#E23E3E";

export function SearchView({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const tail = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
        const res = await clientFetch(`/recipes${tail}`);
        const data = (await res.json()) as { recipes: RecipeListItem[] };
        if (!cancelled) setRecipes(data.recipes ?? []);
      } catch {
        if (!cancelled) setRecipes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 touch-manipulation"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
        <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-full border border-rose-100 bg-zinc-50 px-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-zinc-400" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch(q)}
            placeholder="Search recipes & ingredients…"
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
        <p className="text-center text-sm text-zinc-500">Searching…</p>
      ) : !recipes.length ? (
        <div className="space-y-4 py-12 text-center">
          <p className="text-lg font-bold text-zinc-900">Not found</p>
          <p className="mx-auto max-w-sm text-sm text-zinc-500">
            Try another keyword or browse categories from Discover.
          </p>
          <Link href="/discover" className="inline-block text-sm font-semibold" style={{ color: primary }}>
            Go to Discover
          </Link>
        </div>
      ) : (
        <RecipeGrid recipes={recipes} />
      )}
    </main>
  );
}
