"use client";

import Link from "next/link";
import { clientFetch } from "@/lib/clientApi";
import { useMemo, useState } from "react";

type Row = {
  recipe_id: string;
  title: string;
  match_ratio: number;
  matched_count: number;
  total_ingredients: number;
  missing_ingredients: string[];
};

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium touch-manipulation ${
        active
          ? "border-(--figma-primary) bg-(--figma-primary) text-white"
          : "border-zinc-200 bg-white text-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

function ResultList({ rows }: { rows: Row[] }) {
  if (!rows.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-900">Best match</h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <Link
            key={row.recipe_id}
            href={`/recipe/${row.recipe_id}`}
            className="block touch-manipulation rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900">{row.title}</p>
                <p className="mt-1 text-xs text-emerald-600">
                  {(row.match_ratio * 100).toFixed(0)}% match ({row.matched_count}/
                  {row.total_ingredients})
                </p>
              </div>
              <span className="text-xl text-zinc-400">›</span>
            </div>
            {!!row.missing_ingredients.length && (
              <div className="mt-3 space-y-1 text-xs text-red-600">
                Missing:
                <ul className="list-inside list-disc">
                  {row.missing_ingredients.map((missing) => (
                    <li key={missing}>{missing}</li>
                  ))}
                </ul>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SuggestExplorer({
  canonicals,
}: {
  canonicals: { canonical_id: string; name: string }[];
}) {
  const lookup = useMemo(() => new Map(canonicals.map((c) => [c.canonical_id, c.name])), [canonicals]);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  function toggle(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function suggest() {
    setBusy(true);
    try {
      const names = Array.from(active)
        .map((id) => lookup.get(id) || id)
        .filter(Boolean);
      const res = await clientFetch("/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_names: names }),
      });
      const data = (await res.json()) as { results: Row[] };
      setRows(data.results ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 py-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
          Pantry match
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">Match by ingredients</h1>
        <p className="text-sm text-zinc-500">Choose what you have; we rank recipes from the API.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {canonicals.map((c) => (
          <Chip
            key={c.canonical_id}
            active={active.has(c.canonical_id)}
            label={c.name}
            onClick={() => toggle(c.canonical_id)}
          />
        ))}
      </div>
      <button
        type="button"
        disabled={busy || !active.size}
        onClick={() => suggest()}
        className="w-full rounded-2xl bg-(--figma-primary) py-3 font-semibold text-white disabled:opacity-40 touch-manipulation"
      >
        {busy ? "Working…" : "Get suggestions"}
      </button>
      <ResultList rows={rows} />
    </div>
  );
}
