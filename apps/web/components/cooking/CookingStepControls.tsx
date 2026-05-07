"use client";

import Link from "next/link";

export function CookingStepControls({
  recipeId,
  index,
  total,
  onPrev,
  onNext,
  onIngredients,
}: {
  recipeId: string;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onIngredients: () => void;
}) {
  const atStart = index <= 0;
  const atEnd = index >= total - 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-xl items-stretch gap-2 px-4">
        <button
          type="button"
          disabled={atStart}
          onClick={onPrev}
          className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-zinc-50 touch-manipulation active:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
        >
          Өмнөх
        </button>
        <button
          type="button"
          disabled={atEnd}
          onClick={onNext}
          className="min-h-[48px] min-w-0 flex-1 rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-black touch-manipulation active:brightness-95 disabled:pointer-events-none disabled:opacity-30"
        >
          Дараах
        </button>
      </div>
      <div className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-4 px-4">
        <Link
          replace
          href={`/recipe/${recipeId}`}
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 touch-manipulation active:bg-white/10"
        >
          ← Жор руу
        </Link>
        <button
          type="button"
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 touch-manipulation active:bg-white/10"
          onClick={onIngredients}
        >
          Орцнууд
        </button>
      </div>
    </div>
  );
}
