"use client";

import Link from "next/link";
import { DifficultyDots } from "@/components/recipe/RecipeCard";
import { SuggestQuickLookDialog } from "@/components/suggest/SuggestQuickLookDialog";
import type { SuggestResultRow } from "@/components/suggest/suggestTypes";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { recipeImageUrl } from "@/lib/imageUrl";
import { useState } from "react";

function difficultyLabelMn(n: number) {
  if (n <= 1) return "Хялбар";
  if (n >= 3) return "Хэцүү";
  return "Дунд";
}

export function SuggestResultCard({ row }: { row: SuggestResultRow }) {
  const [open, setOpen] = useState(false);
  const src = recipeImageUrl(row.image_r2_key);
  const totalMin = row.prep_time + row.cook_time;
  const pct = (row.match_ratio * 100).toFixed(0);
  const href = `/recipe/${row.recipe_id}`;
  const preview = row.ingredients_preview ?? [];

  return (
    <>
      <div className="flex gap-3 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/80">
        <Link
          href={href}
          className="relative block h-28 w-28 shrink-0 overflow-hidden bg-zinc-200 touch-manipulation active:opacity-95 sm:h-32 sm:w-32"
        >
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-3xl">
              {cuisineEmoji(row.cuisine)}
            </div>
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-2 sm:pr-3">
          <Link href={href} className="touch-manipulation">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-left font-semibold leading-snug text-zinc-900">
                {row.title}
              </h3>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-800">
                {pct}%
              </span>
            </div>
            <p className="mt-1 text-left text-xs text-emerald-700">
              Орц тааралт {row.matched_count}/{row.total_ingredients}
            </p>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={preview.length === 0}
            className="mt-2 w-full rounded-xl border border-(--figma-primary)/30 bg-white px-3 py-2 text-left text-sm font-semibold text-(--figma-primary) shadow-sm touch-manipulation active:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Хурдан харах — орц, тоо хэмжээ
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <DifficultyDots value={row.difficulty} />
              <span>{difficultyLabelMn(row.difficulty)}</span>
            </span>
            <span className="tabular-nums">
              {totalMin > 0 ? `~${totalMin} мин` : "—"}
            </span>
            <span>{row.serves} хүн</span>
          </div>
          <Link
            href={href}
            className="mt-2 text-[11px] font-medium text-(--figma-primary) touch-manipulation"
          >
            Дэлгэрэнгүй үзэх (алхмууд) →
          </Link>
        </div>
      </div>
      <SuggestQuickLookDialog
        open={open}
        onClose={() => setOpen(false)}
        title={row.title}
        description={row.description}
        serves={row.serves}
        lines={preview}
        recipeHref={href}
      />
    </>
  );
}
