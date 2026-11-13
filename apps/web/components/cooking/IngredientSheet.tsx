"use client";

import { useEffect } from "react";
import { IngredientChecklist } from "@/components/cooking/IngredientChecklist";
import type { IngredientRow } from "@/lib/types";
import type { ScaleCtx } from "@/lib/ingredientScale";

export function IngredientSheet({
  open, onClose, items, ctx, sessionId, serves,
}: {
  open: boolean;
  onClose: () => void;
  items: IngredientRow[];
  ctx: ScaleCtx;
  sessionId: string;
  serves: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="Орцын жагсаалтыг хаах"
        onClick={onClose} type="button" />
      <div role="dialog" aria-modal="true" aria-labelledby="ingredient-dialog-title"
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[75dvh] max-w-xl space-y-4 overflow-y-auto rounded-t-[28px] border border-white/10 bg-zinc-950 p-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="ingredient-dialog-title" className="text-lg font-semibold">Орцны жагсаалт</h3>
            <p className="text-xs text-zinc-400">{serves} порцын хэмжээ</p>
          </div>
          <button type="button" className="min-h-11 rounded-xl border border-white/20 px-4 text-sm text-white"
            onClick={onClose}>Хаах</button>
        </div>
        <IngredientChecklist key={sessionId} rows={items} ctx={ctx} sessionId={sessionId} />
      </div>
    </div>
  );
}