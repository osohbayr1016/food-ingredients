"use client";

import type { TagRow } from "@/lib/adminRecipeFetch";

type Props = {
  tags: TagRow[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function RecipeTagsPicker({ tags, selectedIds, onChange }: Props) {
  const set = new Set(selectedIds);

  function toggle(id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-800">Шошго</h2>
      {tags.length === 0 ? (
        <p className="text-sm text-zinc-500">Шошго алга.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
                <input
                  type="checkbox"
                  checked={set.has(t.id)}
                  onChange={() => toggle(t.id)}
                  className="h-4 w-4 rounded accent-red-500"
                />
                {t.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
