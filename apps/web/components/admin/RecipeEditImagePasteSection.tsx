"use client";

import { useState } from "react";
import {
  RECIPE_IMAGE_SLOT_COUNT,
  RecipeImagePasteGrid,
} from "@/components/admin/RecipeImagePasteGrid";
import { presignAndPutRecipeImage } from "@/lib/adminImageUpload";
import { patchAdminRecipe } from "@/lib/adminRecipeImportSubmit";
import type { RecipePatchPayload } from "@/lib/adminRecipeTypes";

function emptySlots(): (Blob | null)[] {
  return Array.from({ length: RECIPE_IMAGE_SLOT_COUNT }, () => null);
}

function parseGalleryKeys(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

type Props = {
  recipeId: string;
  adminSecret: string;
  payload: RecipePatchPayload;
  setPayload: (p: RecipePatchPayload) => void;
  setErr: (s: string | null) => void;
  setSavedMsg: (s: string | null) => void;
};

export function RecipeEditImagePasteSection({
  recipeId,
  adminSecret,
  payload,
  setPayload,
  setErr,
  setSavedMsg,
}: Props) {
  const [slots, setSlots] = useState<(Blob | null)[]>(emptySlots);
  const [busy, setBusy] = useState(false);

  async function uploadAndPersist() {
    if (!adminSecret.trim()) {
      setErr("ADMIN нууц шаардлагатай.");
      return;
    }
    const toUpload = slots.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
    if (toUpload.length === 0) {
      setErr("Paste эсвэл файл сонгоод дараа нь «R2 + хадгалах» дарна уу.");
      return;
    }
    setBusy(true);
    setErr(null);
    setSavedMsg(null);
    try {
      const keys: (string | null)[] = Array(RECIPE_IMAGE_SLOT_COUNT).fill(null);
      for (const i of toUpload) {
        const b = slots[i];
        if (b) keys[i] = await presignAndPutRecipeImage(adminSecret, recipeId, b);
      }
      const existingGallery = parseGalleryKeys(payload.recipe.gallery_r2_keys);
      const newGalleryKeys = keys.slice(1).filter((k): k is string => k != null);
      const galleryOut =
        newGalleryKeys.length > 0
          ? JSON.stringify([...existingGallery, ...newGalleryKeys])
          : payload.recipe.gallery_r2_keys;
      const hero = keys[0] != null ? keys[0] : payload.recipe.image_r2_key;
      const next: RecipePatchPayload = {
        ...payload,
        recipe: {
          ...payload.recipe,
          image_r2_key: hero ?? null,
          gallery_r2_keys: galleryOut?.trim() ? galleryOut : null,
        },
      };
      const res = await patchAdminRecipe(adminSecret, recipeId, next);
      if (!res.ok) {
        setErr("R2 ачаалсан ч жорыг шинэчлэхэд алдаа гарлаа.");
        return;
      }
      setPayload(next);
      setSlots(emptySlots());
      setSavedMsg("Зураг R2-д орж, жор шинэчлэгдлээ.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ачаалал амжилтгүй.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-800">Зураг paste / файл</h2>
      <p className="text-xs text-zinc-600">
        #1 = нүүр (image_r2_key), #2–5 = галерейн дараалалд нэмэгдэнэ. R2 руу ачаалсны дараа
        жор автоматаар хадгалагдана.
      </p>
      <RecipeImagePasteGrid slots={slots} onSlotsChange={setSlots} />
      <button
        type="button"
        disabled={busy || !slots.some((b) => b != null)}
        onClick={() => void uploadAndPersist()}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Ачаалж байна…" : "R2 + жор шинэчлэх"}
      </button>
    </div>
  );
}
