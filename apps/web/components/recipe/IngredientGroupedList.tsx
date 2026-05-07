import { buildIngredientPhrase, type ScaleCtx } from "@/lib/ingredientScale";
import type { IngredientRow } from "@/lib/types";

export function IngredientGroupedList({
  items,
  ctx,
}: {
  items: IngredientRow[];
  ctx: ScaleCtx;
}) {
  const groups = new Map<string, IngredientRow[]>();
  for (const ing of items) {
    const k = ing.category_name || ing.category_id;
    groups.set(k, [...(groups.get(k) ?? []), ing]);
  }
  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([name, rows]) => (
        <div key={name} className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{name}</div>
          <ul className="space-y-2 text-sm">
            {rows.map((ing) => (
              <li
                key={ing.id}
                className="flex justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2"
              >
                <span className="font-medium text-zinc-900">{ing.name}</span>
                <span className="text-zinc-600">{buildIngredientPhrase(ing, ctx)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
