"use client";

import { buildIngredientPhrase, type ScaleCtx } from "@/lib/ingredientScale";
import type { IngredientRow } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

function storageKey(sessionId: string, rows: IngredientRow[]) {
  return `ing_ck_v2:${sessionId}:${rows.map(r => r.id).sort().join("|")}`;
}

export function IngredientChecklist({
  rows, ctx, sessionId,
}: {
  rows: IngredientRow[];
  ctx: ScaleCtx;
  sessionId: string;
}) {
  const key = useMemo(() => storageKey(sessionId, rows), [sessionId, rows]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
      setChecks(Object.fromEntries(rows.map(r => [r.id, parsed?.[r.id] === true])));
    } catch {
      setChecks(Object.fromEntries(rows.map(r => [r.id, false])));
    }
    setLoadedKey(key);
  }, [key, rows]);

  useEffect(() => {
    if (loadedKey !== key) return;
    try { localStorage.setItem(key, JSON.stringify(checks)); }
    catch { /* checkboxes remain usable without storage */ }
  }, [checks, key, loadedKey]);

  return (
    <ul className="space-y-2 text-sm">
      {rows.map(row => (
        <li key={row.id}>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 py-2">
            <input type="checkbox" checked={Boolean(checks[row.id])}
              onChange={e => setChecks(prev => ({ ...prev, [row.id]: e.target.checked }))}
              className="h-5 w-5 shrink-0 accent-amber-500" />
            <span className={`min-w-0 flex-1 ${checks[row.id] ? "text-zinc-500 line-through" : "text-white"}`}>
              {row.name}
            </span>
            <span className={`shrink-0 text-right tabular-nums ${checks[row.id] ? "text-zinc-600" : "text-amber-200"}`}>
              {buildIngredientPhrase(row, ctx)}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}