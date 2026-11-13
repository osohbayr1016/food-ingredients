"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RecipeTagFilter } from "./RecipeTagFilter";
import { ALLERGEN_OPTIONS } from "@/lib/recipeMetadata";

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
      <div className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50 p-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-amber-900">Орцын харшил — хасах</span>
          <select value={sp?.get("exclude_allergens") ?? ""} className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2"
            onChange={e => {
              const q = new URLSearchParams(sp?.toString());
              if (e.target.value) q.set("exclude_allergens", e.target.value);
              else q.delete("exclude_allergens");
              router.push(`/?${q.toString()}`);
            }}>
            <option value="">Шүүхгүй</option>
            {ALLERGEN_OPTIONS.map(([id,label]) => <option key={id} value={id}>{label} ороогүй</option>)}
          </select>
        </label>
        <p className="text-[11px] leading-relaxed text-amber-900">Шалгаж баталгаажуулаагүй жорууд харшлын шүүлтүүрт харагдахгүй. Энэ нь бохирдлын эрсдэлийг үгүйсгэхгүй.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([["max_calories","Дээд илчлэг (ккал)"],["min_protein","Доод уураг (г)"]] as const).map(([key,label]) => (
          <label key={key} className="block text-xs text-zinc-600">{label}
            <input type="number" inputMode="numeric" min={key === "max_calories" ? 1 : 0}
              defaultValue={sp?.get(key) ?? ""} placeholder="Хязгааргүй"
              onBlur={e => {
                const q = new URLSearchParams(sp?.toString());
                const v = e.target.value.trim();
                if (v) q.set(key,v); else q.delete(key);
                router.push(`/?${q.toString()}`);
              }}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" />
          </label>
        ))}
      </div>
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
