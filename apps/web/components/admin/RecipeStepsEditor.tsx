"use client";

import type { StepRow } from "@/lib/adminRecipeTypes";

type Props = {
  steps: StepRow[];
  onChange: (next: StepRow[]) => void;
};

export function RecipeStepsEditor({ steps, onChange }: Props) {
  function row(i: number, patch: Partial<StepRow>) {
    const next = steps.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange(next);
  }

  function add() {
    onChange([...steps, { description: "" }]);
  }

  function remove(i: number) {
    onChange(steps.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">Алхам</h2>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          + Алхам нэмэх
        </button>
      </div>
      <ol className="list-decimal space-y-3 pl-5">
        {steps.map((s, i) => (
          <li key={s.id ?? `st-${i}`} className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
            <textarea
              value={s.description}
              onChange={(e) => row(i, { description: e.target.value })}
              rows={2}
              placeholder="Тайлбар"
              className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1 text-xs text-zinc-600">
                Таймер (сек)
                <input
                  type="number"
                  min={0}
                  value={s.timer_seconds ?? ""}
                  onChange={(e) =>
                    row(i, {
                      timer_seconds: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="w-24 rounded border border-zinc-200 px-2 py-1"
                />
              </label>
              <input
                value={s.tip ?? ""}
                onChange={(e) =>
                  row(i, { tip: e.target.value.trim() ? e.target.value : null })
                }
                placeholder="Зөвлөмж"
                className="min-w-[8rem] flex-1 rounded border border-zinc-200 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs text-red-600 underline"
              >
                Хасах
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
