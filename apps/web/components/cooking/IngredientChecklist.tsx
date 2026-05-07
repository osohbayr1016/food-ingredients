"use client";

import type { IngredientRow } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

function storageKey(rows: IngredientRow[]) {
  const sig = rows
    .map((r) => r.id)
    .sort()
    .join("|");
  return `ing_ck:${sig}`;
}

export function IngredientChecklist({ rows }: { rows: IngredientRow[] }) {
  const key = useMemo(() => storageKey(rows), [rows]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        const init: Record<string, boolean> = {};
        rows.forEach((r) => (init[r.id] = false));
        setChecks(init);
        return;
      }
      setChecks(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      const init: Record<string, boolean> = {};
      rows.forEach((r) => (init[r.id] = false));
      setChecks(init);
    }
  }, [key, rows]);

  useEffect(() => {
    if (!Object.keys(checks).length) return;
    localStorage.setItem(key, JSON.stringify(checks));
  }, [checks, key]);

  return (
    <ul className="space-y-2 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex gap-3 items-start">
          <button
            type="button"
            className={`mt-0.5 h-6 w-6 rounded-full border touch-manipulation ${
              checks[row.id]
                ? "bg-amber-500 border-amber-500 text-black"
                : "border-white/30"
            }`}
            onClick={() =>
              setChecks((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
            }
            aria-label={row.name}
          />
          <span className={checks[row.id] ? "text-zinc-500 line-through" : ""}>
            {row.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
