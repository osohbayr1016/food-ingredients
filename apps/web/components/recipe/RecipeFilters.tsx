"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RecipeTagFilter } from "./RecipeTagFilter";

const cuisines = ["", "Italian", "French", "Chinese", "Korean", "Mongolian"];

export function RecipeFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending] = useTransition();

  return (
    <div className="flex flex-col gap-2 pb-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs text-zinc-500">Cuisine</span>
          <select
            disabled={pending}
            defaultValue={sp?.get("cuisine") ?? ""}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 touch-manipulation"
            onChange={(e) => {
              const q = new URLSearchParams(sp?.toString());
              if (e.target.value) q.set("cuisine", e.target.value);
              else q.delete("cuisine");
              router.push(`/?${q.toString()}`);
            }}
          >
            {cuisines.map((c) => (
              <option key={c || "all"} value={c}>
                {c || "All"}
              </option>
            ))}
          </select>
        </label>
        <RecipeTagFilter />
      </div>
      <label className="space-y-1">
        <span className="text-xs text-zinc-500">Difficulty (1–3)</span>
        <input
          disabled={pending}
          type="number"
          min={1}
          max={3}
          placeholder="Any"
          defaultValue={sp?.get("difficulty") ?? ""}
          className="input-number-no-spin w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 touch-manipulation"
          onBlur={(e) => {
            const q = new URLSearchParams(sp?.toString());
            const v = e.target.value.trim();
            if (v) q.set("difficulty", v);
            else q.delete("difficulty");
            router.push(`/?${q.toString()}`);
          }}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-zinc-500">Max cook (min)</span>
        <input
          disabled={pending}
          type="number"
          min={5}
          placeholder="Any"
          defaultValue={sp?.get("max_cook_time") ?? ""}
          className="input-number-no-spin w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 touch-manipulation"
          onBlur={(e) => {
            const q = new URLSearchParams(sp?.toString());
            const v = e.target.value.trim();
            if (v) q.set("max_cook_time", v);
            else q.delete("max_cook_time");
            router.push(`/?${q.toString()}`);
          }}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-zinc-500">Search</span>
        <input
          disabled={pending}
          placeholder="Recipe or ingredient"
          defaultValue={sp?.get("q") ?? ""}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 touch-manipulation"
          onBlur={(e) => {
            const q = new URLSearchParams(sp?.toString());
            const v = e.target.value.trim();
            if (v) q.set("q", v);
            else q.delete("q");
            router.push(`/?${q.toString()}`);
          }}
        />
      </label>
    </div>
  );
}
