"use client";

import Link from "next/link";
import { QuickLookIngredientBlocks } from "@/components/suggest/QuickLookIngredientBlocks";
import type { IngredientPreviewLine } from "@/components/suggest/suggestTypes";

export function SuggestQuickLookDialog({
  open,
  onClose,
  title,
  description,
  serves,
  lines,
  recipeHref,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  serves: number;
  lines: IngredientPreviewLine[];
  recipeHref: string;
}) {
  if (!open) return null;

  const missing = lines.filter((l) => !l.matched);
  const have = lines.filter((l) => l.matched);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="quick-look-title"
      onClick={onClose}
    >
      <div
        className="max-h-[88dvh] w-full max-w-lg overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-xl sm:max-h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3">
          <h2 id="quick-look-title" className="text-lg font-bold text-zinc-900">
            Хурдан харах
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 touch-manipulation active:bg-zinc-100"
          >
            Хаах
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div>
            <p className="font-semibold text-zinc-900">{title}</p>
            {serves > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                Үндсэн орц · {serves} хүн
              </p>
            )}
            {description?.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {description.trim()}
              </p>
            ) : null}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Алхмууд энд багтсангүй — зөвхөн орц, тоо хэмжээ
          </p>

          <QuickLookIngredientBlocks missing={missing} have={have} all={lines} />

          <Link
            href={recipeHref}
            onClick={onClose}
            className="block w-full rounded-2xl bg-(--figma-primary) py-3 text-center text-sm font-semibold text-white touch-manipulation"
          >
            Жорыг бүрэн нээх (алхмууд)
          </Link>
        </div>
      </div>
    </div>
  );
}
