"use client";

import type { IngRow } from "@/lib/adminRecipeTypes";
import type { IngredientCategoryRow } from "@/lib/adminRecipeFetch";

type Props = {
  ingredients: IngRow[];
  categories: IngredientCategoryRow[];
  onChange: (next: IngRow[]) => void;
};

export function RecipeIngredientsEditor({ ingredients, categories, onChange }: Props) {
  function row(i: number, patch: Partial<IngRow>) {
    const next = ingredients.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange(next);
  }

  function add() {
    onChange([
      ...ingredients,
      {
        name: "",
        quantity: 1,
        unit: "",
        category_id: categories[0]?.id ?? "cat-extra",
        sort_order: ingredients.length,
      },
    ]);
  }

  function remove(i: number) {
    onChange(ingredients.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">Орц</h2>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          + Мөр нэмэх
        </button>
      </div>
      <ul className="space-y-3">
        {ingredients.map((ing, i) => (
          <li
            key={ing.id ?? `new-${i}`}
            className="grid gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 sm:grid-cols-12"
          >
            <input
              value={ing.name}
              onChange={(e) => row(i, { name: e.target.value })}
              placeholder="Нэр"
              className="sm:col-span-4 rounded border border-zinc-200 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min={0}
              step="any"
              value={ing.quantity}
              onChange={(e) => row(i, { quantity: Number(e.target.value) || 0 })}
              className="sm:col-span-2 rounded border border-zinc-200 px-2 py-1.5 text-sm"
            />
            <input
              value={ing.unit}
              onChange={(e) => row(i, { unit: e.target.value })}
              placeholder="нэгж"
              className="sm:col-span-2 rounded border border-zinc-200 px-2 py-1.5 text-sm"
            />
            <select
              value={ing.category_id}
              onChange={(e) => row(i, { category_id: e.target.value })}
              className="sm:col-span-3 rounded border border-zinc-200 px-2 py-1.5 text-sm"
            >
              {categories.length === 0 ? (
                <option value="cat-extra">Бусад</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              className="sm:col-span-1 text-sm text-red-600 underline"
            >
              Хасах
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
