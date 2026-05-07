import type { IngredientPreviewLine } from "@/components/suggest/suggestTypes";

export function formatIngredientAmount(q: number, unit: string) {
  const u = unit?.trim() ?? "";
  const n = Number.isInteger(q)
    ? String(q)
    : String(Math.round(q * 100) / 100);
  return u ? `${n} ${u}` : n;
}

function groupByCategory(rows: IngredientPreviewLine[]) {
  const m = new Map<string, IngredientPreviewLine[]>();
  for (const r of rows) {
    const k = r.category_name || "Бусад";
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return [...m.entries()];
}

export function QuickLookIngredientBlocks({
  missing,
  have,
  all,
}: {
  missing: IngredientPreviewLine[];
  have: IngredientPreviewLine[];
  all: IngredientPreviewLine[];
}) {
  return (
    <>
      {missing.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-rose-700">
            Дутуу орц (тоо, нэгж)
          </h3>
          {groupByCategory(missing).map(([cat, rows]) => (
            <div key={cat} className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400">{cat}</p>
              <ul className="space-y-1.5">
                {rows.map((ing, i) => (
                  <li
                    key={`m-${ing.name}-${i}`}
                    className="flex justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-zinc-900">{ing.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-700">
                      {formatIngredientAmount(ing.quantity, ing.unit)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {have.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-emerald-800">
            Таны орцонд таарсан
          </h3>
          {groupByCategory(have).map(([cat, rows]) => (
            <div key={cat} className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400">{cat}</p>
              <ul className="space-y-1.5">
                {rows.map((ing, i) => (
                  <li
                    key={`h-${ing.name}-${i}`}
                    className="flex justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-zinc-900">{ing.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-600">
                      {formatIngredientAmount(ing.quantity, ing.unit)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {all.some((l) => l.note?.trim()) && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-700">Тэмдэглэл</h3>
          <ul className="space-y-1 text-xs text-zinc-600">
            {all
              .filter((l) => l.note?.trim())
              .map((ing, i) => (
                <li key={`n-${i}`}>
                  <span className="font-medium text-zinc-800">{ing.name}: </span>
                  {ing.note!.trim()}
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}
