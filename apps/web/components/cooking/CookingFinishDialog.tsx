"use client";

import { clientFetch } from "@/lib/clientApi";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CookingFinishDialog({
  open,
  recipeId,
  onClose,
}: {
  open: boolean;
  recipeId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function save() {
    try {
      setPending(true);
      await clientFetch(`/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipeId,
          rating,
          personal_note: note.trim() || undefined,
        }),
      });
      onClose();
      router.replace(`/recipe/${recipeId}`);
    } catch {
      setPending(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase text-zinc-500 mb-1">Дууслаа</p>
          <h3 className="text-xl font-semibold">Үнэлгээ үлдээнэ үү?</h3>
          <p className="text-sm text-zinc-400">Хадгалсан түүхэнд орно.</p>
        </div>
        <label className="block text-xs text-zinc-500">
          Оноо (1–5)
          <input
            type="range"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full accent-amber-500 touch-manipulation"
          />
          <div className="text-white text-sm text-center">{rating} ⭐</div>
        </label>
        <textarea
          placeholder="Тэмдэглэл (сонголт)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-2xl bg-zinc-900 border border-white/10 p-3 text-sm min-h-[80px]"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => onClose()}
            className="rounded-full px-4 py-2 text-sm touch-manipulation"
          >
            Алгасах
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black touch-manipulation"
          >
            Хадгалах
          </button>
        </div>
      </div>
    </div>
  );
}
