"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { RecipePatchPayload } from "@/lib/adminRecipeTypes";
import { createRecipeWithOptionalImages } from "@/lib/adminRecipeImportSubmit";
import {
  RECIPE_IMAGE_SLOT_COUNT,
  RecipeImagePasteGrid,
} from "@/components/admin/RecipeImagePasteGrid";
import { useAdminSecret } from "@/components/admin/AdminSecretContext";

function emptyImageSlots(): (Blob | null)[] {
  return Array.from({ length: RECIPE_IMAGE_SLOT_COUNT }, () => null);
}

export function JsonRecipeUploadForm() {
  const { adminSecret } = useAdminSecret();
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [imageSlots, setImageSlots] = useState<(Blob | null)[]>(emptyImageSlots);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jsonPayload, setJsonPayload] = useState<RecipePatchPayload | null>(null);

  const onSlotsChange = useCallback((next: (Blob | null)[]) => {
    setImageSlots(next);
  }, []);

  const handleFile = async (file: File) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setMessage(null);
    setCreatedId(null);
    setJsonPayload(null);

    try {
      const text = await file.text();
      let parsed = JSON.parse(text);

      if (parsed.recipe && Array.isArray(parsed.recipe.ingredients) && Array.isArray(parsed.recipe.steps)) {
        const rawRecipe = parsed.recipe;
        parsed = {
          recipe: {
            title: rawRecipe.title,
            cuisine: rawRecipe.cuisine || rawRecipe.origin?.split(" ")[0] || "Unknown",
            prep_time: rawRecipe.time?.preparation_minutes || 0,
            cook_time: rawRecipe.time?.cook_minutes || 0,
            difficulty: 2,
            description: rawRecipe.description || "",
            tips: rawRecipe.notes ? rawRecipe.notes.join("\n") : "",
            serves: rawRecipe.base_servings || 2,
            is_published: true,
          },
          ingredients: rawRecipe.ingredients.map((i: { name?: string; amount?: number; quantity?: number; unit?: string; category_id?: string }, index: number) => ({
            name: String(i.name || ""),
            quantity: Number(i.amount) || Number(i.quantity) || 0,
            unit: String(i.unit || ""),
            category_id: String(i.category_id || "cat-extra"),
            sort_order: index,
          })),
          steps: rawRecipe.steps.map((s: { content?: string; description?: string; timer_seconds?: number }) => ({
            description: String(s.content || s.description || ""),
            timer_seconds: s.timer_seconds ? Number(s.timer_seconds) : null,
          })),
        };
      }

      if (!parsed.recipe || !parsed.recipe.title) {
        throw new Error("Invalid JSON format. Expected RecipePatchPayload with a valid recipe title.");
      }
      setJsonPayload(parsed as RecipePatchPayload);
    } catch (err) {
      setMessage("Файл уншихад эсвэл задлахад алдаа гарлаа: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreatedId(null);

    if (!adminSecret.trim()) {
      setMessage("Дээрх админ түлхүүр талбарыг бөглөнө үү.");
      return;
    }

    if (!jsonPayload) {
      setMessage("Эхлээд JSON файл оруулна уу.");
      return;
    }

    const body: RecipePatchPayload = {
      ...jsonPayload,
      recipe: {
        ...jsonPayload.recipe,
        is_published: publish,
      },
    };

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
      setJsonPayload(null);
      setSelectedFileName(null);
      setImageSlots(emptyImageSlots());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 rounded-2xl bg-white p-8 shadow-sm border border-zinc-100">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Шинэ жор үүсгэх</h2>
        <p className="text-sm text-zinc-500">
          JSON файл оруулан жороо үүсгэнэ үү. Зөвхөн бэлтгэгдсэн форматтай өгөгдлийг хүлээж авна.
        </p>
      </div>

      <div className="space-y-4">
        {/* Drag and drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
            dragActive
              ? "border-[#E23E3E] bg-[#E23E3E]/5"
              : jsonPayload
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100/50"
          }`}
        >
          <input
            type="file"
            accept=".json,application/json"
            onChange={onFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload JSON file"
          />
          <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
            {jsonPayload ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Файл амжилттай уншигдлаа</p>
                  <p className="text-xs text-emerald-600/80 mt-1">{selectedFileName} • &quot;{jsonPayload.recipe.title}&quot;</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    JSON файлаа энд чирч оруулна уу
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">эсвэл товшиж сонгоно уу</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <RecipeImagePasteGrid slots={imageSlots} onSlotsChange={onSlotsChange} />

      <label className="flex items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-[#E23E3E]"
        />
        Нийтлэх (вэб дээр шууд харагдана)
      </label>

      {message ? (
        <div className={`rounded-xl p-4 text-sm ${message.includes("Амжилттай") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
          {message}
        </div>
      ) : null}

      {createdId ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Амжилттай үүслээ.{" "}
          <Link href={`/recipe/${createdId}`} className="font-semibold underline">
            Жорыг нээж харах
          </Link>
        </div>
      ) : null}

      <div className="pt-2">
        <button
          type="submit"
          disabled={busy || !jsonPayload}
          className="w-full sm:w-auto rounded-xl bg-[#E23E3E] px-8 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:bg-[#c93636]"
        >
          {busy ? "Илгээж байна…" : "Жорыг нийтлэх"}
        </button>
      </div>
    </form>
  );
}
