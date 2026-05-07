"use client";

import type { RecipeRow } from "@/lib/adminRecipeTypes";

type Props = {
  recipe: RecipeRow;
  onChange: (next: RecipeRow) => void;
};

export function RecipeMetaFields({ recipe, onChange }: Props) {
  function patch(p: Partial<RecipeRow>) {
    onChange({ ...recipe, ...p });
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-800">Ерөнхий</h2>
      <label className="block text-sm">
        <span className="text-zinc-600">Гарчиг</span>
        <input
          value={recipe.title}
          onChange={(e) => patch({ title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-600">Гарал / Ангилал</span>
          <input
            value={recipe.cuisine}
            onChange={(e) => patch({ cuisine: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600">Хүний тоо</span>
          <input
            type="number"
            min={1}
            value={recipe.serves}
            onChange={(e) => patch({ serves: Number(e.target.value) || 1 })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600">Бэлтгэх (мин)</span>
          <input
            type="number"
            min={0}
            value={recipe.prep_time}
            onChange={(e) => patch({ prep_time: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600">Жигнэх / Чанах (мин)</span>
          <input
            type="number"
            min={0}
            value={recipe.cook_time}
            onChange={(e) => patch({ cook_time: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600">Хэцүүн (1–3)</span>
          <input
            type="number"
            min={1}
            max={3}
            value={recipe.difficulty}
            onChange={(e) =>
              patch({
                difficulty: Math.min(3, Math.max(1, Number(e.target.value) || 2)),
              })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!recipe.is_published}
          onChange={(e) => patch({ is_published: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-300 accent-red-500"
        />
        <span className="text-zinc-700">Вэб дээр нийтлэх</span>
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Тайлбар</span>
        <textarea
          value={recipe.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Зөвлөмж / Tips</span>
        <textarea
          value={recipe.tips ?? ""}
          onChange={(e) => patch({ tips: e.target.value.trim() ? e.target.value : null })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Нүүр зургийн R2 түлхүүр</span>
        <input
          value={recipe.image_r2_key ?? ""}
          onChange={(e) =>
            patch({
              image_r2_key: e.target.value.trim() ? e.target.value.trim() : null,
            })
          }
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs"
          placeholder="recipes/…"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Галерей JSON (массив түлхүүрүүд)</span>
        <textarea
          value={recipe.gallery_r2_keys ?? ""}
          onChange={(e) =>
            patch({
              gallery_r2_keys: e.target.value.trim() ? e.target.value.trim() : null,
            })
          }
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs"
          placeholder='["recipes/..."]'
        />
      </label>
    </div>
  );
}
