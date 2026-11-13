"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
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
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<"saved" | "history">("saved");
  const [saved, setSaved] = useState<Array<RecipeListItem & { saved_at?: string }>>([]);
  const [hist, setHist] = useState<Hist[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let controller = new AbortController();
    const load = async () => {
      controller.abort();
      controller = new AbortController();
      if (!user) {
        setSaved([]);
        setHist([]);
        setErr(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const [sa, hi] = await Promise.all([
          clientFetch("/saved", { signal: controller.signal }),
          clientFetch("/history", { signal: controller.signal }),
        ]);
        if (!sa.ok || !hi.ok) throw new Error("library_request_failed");
        const savedJson = await sa.json() as { saved?: RecipeListItem[] };
        const histJson = await hi.json() as { history?: Hist[] };
        if (!Array.isArray(savedJson.saved) || !Array.isArray(histJson.history)) {
          throw new Error("library_invalid_response");
        }
        if (!cancelled && !controller.signal.aborted) {
          setSaved(savedJson.saved);
          setHist(histJson.history);
        }
      } catch {
        if (!cancelled && !controller.signal.aborted)
          setErr("Хадгалсан жор болон түүхийг ачаалж чадсангүй.");
      } finally {
        if (!cancelled && !controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("food-library-changed", refresh);
    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener("food-library-changed", refresh);
    };
  }, [user?.id, retry]);

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
          {key === "saved" ? "Хадгалсан" : "Түүх"}
        </button>
      ))}
    </div>
  );

  if (!ready) {
    return (
      <main className="py-10 text-center text-sm text-zinc-500">Ачааллаж байна…</main>
    );
  }

  if (!user) {
    return (
      <main className="space-y-4 py-10 text-center">
        <h1 className="text-xl font-bold text-zinc-900">Хадгалсан жор</h1>
        <p className="text-sm text-zinc-600">
          Энд жагсаахын тулд нэвтэрнэ үү.
        </p>
        <Link
          href="/login?next=/saved"
          className="inline-block rounded-full bg-(--figma-primary) px-6 py-3 text-sm font-semibold text-white touch-manipulation"
        >
          Нэвтрэх
        </Link>
        <div>
          <Link href="/signup" className="text-sm text-(--figma-primary) touch-manipulation">
            Бүртгүүлэх
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4 py-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
            Миний цуглуулга
          </p>
          <h1 className="text-2xl font-bold text-zinc-900">Хадгалсан жорууд</h1>
          <p className="mt-1 text-sm text-zinc-500">Таны бүртгэлтэй холбогдсон.</p>
        </div>
        <Link
          href="/search"
          aria-label="Жор хайх"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 touch-manipulation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      </header>
      {tabs}
      {err && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {err}
        <button type="button" onClick={() => setRetry(n => n + 1)}
          className="ml-3 font-semibold underline">Дахин оролдох</button>
      </div>}
      {loading && <p role="status" className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">Миний жорууд ачаалж байна…</p>}
      {!loading && !err && (tab === "saved" ? (
        saved.length ? (
          <RecipeGrid recipes={saved} />
        ) : (
          <p className="text-sm text-zinc-500">Одоогоор хадгалсан зүйл алга.</p>
        )
      ) : (
        <HistoryList rows={hist} />
      ))}
    </main>
  );
}

function HistoryList({ rows }: { rows: Hist[] }) {
  if (!rows.length) return <p className="text-sm text-zinc-500">Түүх хоосон.</p>;
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
            Дахин гаргах →
          </Link>
        </div>
      ))}
    </div>
  );
}
