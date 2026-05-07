"use client";

import { IngredientChecklist } from "@/components/cooking/IngredientChecklist";
import type { IngredientRow } from "@/lib/types";

export function IngredientSheet({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: IngredientRow[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <button
        className="absolute inset-0"
        aria-label="Close sheet backdrop"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-x-0 bottom-0 max-w-xl mx-auto rounded-t-[28px] border border-white/10 bg-zinc-950 p-6 space-y-4 max-h-[70vh] overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Орцны жагсаалт</h3>
          <button
            type="button"
            className="text-sm text-zinc-400 touch-manipulation"
            onClick={onClose}
          >
            Хаах
          </button>
        </div>
        <IngredientChecklist rows={items} />
      </div>
    </div>
  );
}
