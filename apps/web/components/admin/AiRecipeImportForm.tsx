"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { parseAiRecipeText } from "@/lib/parseAiRecipeText";
import type { RecipePatchPayload } from "@/lib/adminRecipeTypes";
import { formatParseError } from "@/lib/parseAiRecipeErrors";
import { createRecipeWithOptionalImages } from "@/lib/adminRecipeImportSubmit";
import {
  RECIPE_IMAGE_SLOT_COUNT,
  RecipeImagePasteGrid,
} from "@/components/admin/RecipeImagePasteGrid";
import { useAdminSecret } from "@/components/admin/AdminSecretContext";

function emptyImageSlots(): (Blob | null)[] {
  return Array.from({ length: RECIPE_IMAGE_SLOT_COUNT }, () => null);
}

export function AiRecipeImportForm() {
  const { adminSecret } = useAdminSecret();
  const [text, setText] = useState("");
  const [publish, setPublish] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [imageSlots, setImageSlots] = useState<(Blob | null)[]>(emptyImageSlots);

  const onSlotsChange = useCallback((next: (Blob | null)[]) => {
    setImageSlots(next);
  }, []);

  const parsed = useMemo(() => parseAiRecipeText(text), [text]);
  const previewPayload = useMemo((): RecipePatchPayload | null => {
    if (!parsed.ok) return null;
    return {
      ...parsed.payload,
      recipe: { ...parsed.payload.recipe, is_published: publish },
    };
  }, [parsed, publish]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreatedId(null);
    if (!adminSecret.trim()) {
      setMessage("Дээрх «ADMIN нууц» талбарыг бөглөнө үү.");
      return;
    }
    if (!parsed.ok) {
      setMessage(`Задлахааргүй байна: ${formatParseError(parsed.error)}`);
      return;
    }
    const body: RecipePatchPayload =
      publish
        ? { ...parsed.payload, recipe: { ...parsed.payload.recipe, is_published: true } }
        : { ...parsed.payload, recipe: { ...parsed.payload.recipe, is_published: false } };

    setBusy(true);
    try {
      const { id, imageWarning } = await createRecipeWithOptionalImages(
        adminSecret.trim(),
        body,
        imageSlots,
      );
      setCreatedId(id);
      if (imageWarning === "upload_failed")
        setMessage("Жор үүссэн; R2 upload идэвхгүй эсвэл алдаа (нүүр зураггүй).");
      else if (imageWarning === "patch_failed")
        setMessage("Зураг upload-дсан боловч жор шинэчлэхэд алдаа.");
      else setMessage(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-base font-semibold text-zinc-900">Шинэ жор импорт</h2>
      <label className="block text-sm font-medium text-zinc-800">
        Хуулсан текст
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
          placeholder="{ … } JSON эсвэл # Гарчиг / ## Ingredients …"
        />
      </label>

      <RecipeImagePasteGrid slots={imageSlots} onSlotsChange={onSlotsChange} />

      <label className="flex items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-red-500"
        />
        Нийтлэх (вэб дээр харагдана)
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#E23E3E] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Илгээж байна…" : "API руу илгээх"}
        </button>
        <button
          type="button"
          onClick={() => setPreviewOpen((o) => !o)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800"
        >
          {previewOpen ? "Урьдчилан харахыг хаах" : "Урьдчилан харах"}
        </button>
      </div>

      {parsed.ok ? (
        <p className="text-sm text-emerald-700">Задлагдлаа: {parsed.payload.recipe.title}</p>
      ) : text.trim() ? (
        <p className="text-sm text-amber-800">Задлах: {formatParseError(parsed.error)}</p>
      ) : null}

      {previewOpen && previewPayload ? (
        <pre className="max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-3 text-xs text-zinc-800">
          {JSON.stringify(previewPayload, null, 2)}
        </pre>
      ) : null}

      {message ? <p className="text-sm text-amber-800">{message}</p> : null}

      {createdId ? (
        <p className="text-sm text-emerald-700">
          Амжилттай.{" "}
          <Link href={`/recipe/${createdId}`} className="font-medium underline">
            Жорыг нээх
          </Link>
        </p>
      ) : null}
    </form>
  );
}
