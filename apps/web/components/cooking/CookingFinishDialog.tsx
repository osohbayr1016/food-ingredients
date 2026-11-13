"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { clientFetch } from "@/lib/clientApi";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CookingFinishDialog({
  open,
  recipeId,
  onClose,
  onSaved,
  onDone,
}: {
  open: boolean;
  recipeId: string;
  onClose: () => void;
  onSaved?: () => void;
  onDone?: () => void;
}) {
  const { user, ready } = useAuth();
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/recipe/${recipeId}/cook`)}`);
      return;
    }
    try {
      setPending(true);
      setError(null);
      const res = await clientFetch(`/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipeId,
          rating,
          personal_note: note.trim() || undefined,
        }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/recipe/${recipeId}/cook`)}`);
        return;
      }
      if (!res.ok) {
        setError("Түүхэнд хадгалах боломжгүй байна. Дахин оролдоорой.");
        return;
      }
      onSaved?.();
      onClose();
      router.replace(`/recipe/${recipeId}`);
    } catch {
      setError("Холболт тасарсан байна. Дахин оролдоорой.");
    } finally {
      setPending(false);
    }
  }

  function finishWithoutSaving() {
    onDone?.();
    router.replace(`/recipe/${recipeId}`);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center px-4" role="dialog" aria-modal="true" aria-labelledby="cooking-finish-title">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase text-zinc-500 mb-1">Дууслаа</p>
          <h3 id="cooking-finish-title" className="text-xl font-semibold">Хоолоо хийж дууслаа!</h3>
          <p className="text-sm text-zinc-400">
            {user
              ? "Хадгалсан түүхэнд орно."
              : "Нэвтрэхгүйгээр хоолоо дуусгаж болно. Түүх хадгалах бол бүртгэл хэрэгтэй."}
          </p>
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
        {error && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">{error}</p>}
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => onClose()}
            className="rounded-full px-4 py-2 text-sm touch-manipulation"
          >
            Үргэлжлүүлэх
          </button>
          <button type="button" disabled={pending} onClick={finishWithoutSaving}
            className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Хадгалахгүй дуусгах
          </button>
          <button
            type="button"
            disabled={pending || !ready}
            onClick={save}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black touch-manipulation"
          >
            {user ? "Хадгалах" : "Нэвтрэх"}
          </button>
        </div>
      </div>
    </div>
  );
}
