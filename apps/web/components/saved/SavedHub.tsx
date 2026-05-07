"use client";

import Link from "next/link";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeListItem } from "@/lib/types";
import { useEffect, useState } from "react";

type Hist = {
  id: string;
  recipe_id: string;
  title?: string;
  cuisine?: string;
  cook_time?: number;
  cooked_at: string;
  rating: number | null;
  personal_note?: string | null;
};

export function SavedHub() {
  const [tab, setTab] = useState<"saved" | "history">("saved");
  const [saved, setSaved] = useState<Array<RecipeListItem & { saved_at?: string }>>([]);
  const [hist, setHist] = useState<Hist[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sa, hi] = await Promise.all([clientFetch("/saved"), clientFetch("/history")]);
        const savedJson = (await sa.json()) as {
          saved: Record<string, unknown>[];
        };
        const histJson = (await hi.json()) as {
          history: Hist[];
        };
        if (!cancelled) {
          setSaved(savedJson.saved as RecipeListItem[] & { saved_at?: string });
          setHist(histJson.history ?? []);
        }
      } catch {
        if (!cancelled) setErr("Could not load saved recipes.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = (
    <div className="mb-4 flex gap-2 rounded-full border border-zinc-200 bg-zinc-50 p-1">
      {(["saved", "history"] as const).map((key) => (
        <button
          key={key}
          type="button"
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold touch-manipulation ${
            tab === key ? "bg-(--figma-primary) text-white" : "text-zinc-600"
          }`}
          onClick={() => setTab(key)}
        >
          {key === "saved" ? "Bookmarks" : "History"}
        </button>
      ))}
    </div>
  );

  return (
    <main className="space-y-4 py-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
            Library
          </p>
          <h1 className="text-2xl font-bold text-zinc-900">My bookmarks</h1>
          <p className="mt-1 text-sm text-zinc-500">Stored on this device — no login required.</p>
          <Link href="/login" className="mt-2 inline-block text-xs font-semibold text-(--figma-primary) touch-manipulation">
            About accounts &amp; future sync →
          </Link>
        </div>
        <Link
          href="/search"
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 touch-manipulation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      </header>
      {tabs}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {tab === "saved" ? (
        saved.length ? (
          <RecipeGrid recipes={saved} />
        ) : (
          <p className="text-sm text-zinc-500">No saved recipes yet.</p>
        )
      ) : (
        <HistoryList rows={hist} />
      )}
    </main>
  );
}

function HistoryList({ rows }: { rows: Hist[] }) {
  if (!rows.length) return <p className="text-sm text-zinc-500">No cook history.</p>;
  return (
    <div className="space-y-3">
      {rows.map((h) => (
        <div key={h.id} className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900">{h.title}</p>
              <p className="text-xs text-zinc-500">{h.cooked_at}</p>
            </div>
            <span className="shrink-0 text-sm text-amber-500">
              {h.rating ? `${"★".repeat(h.rating)}` : "—"}
            </span>
          </div>
          {!!h.personal_note && (
            <p className="text-sm text-zinc-600">{h.personal_note}</p>
          )}
          <Link href={`/recipe/${h.recipe_id}/cook`} className="text-xs font-semibold text-(--figma-primary) touch-manipulation">
            Cook again →
          </Link>
        </div>
      ))}
    </div>
  );
}
