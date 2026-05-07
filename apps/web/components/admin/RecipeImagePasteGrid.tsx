"use client";

import { useCallback, useEffect, useState } from "react";

export const RECIPE_IMAGE_SLOT_COUNT = 5;

function blobFromClipboard(e: React.ClipboardEvent): Blob | null {
  const items = e.clipboardData?.items;
  if (!items?.length) return null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === "file" && it.type.startsWith("image/")) {
      const f = it.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

type Props = {
  slots: (Blob | null)[];
  onSlotsChange: (next: (Blob | null)[]) => void;
};

export function RecipeImagePasteGrid({ slots, onSlotsChange }: Props) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = slots.map((b) => (b ? URL.createObjectURL(b) : ""));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [slots]);

  const setSlot = useCallback(
    (index: number, blob: Blob | null) => {
      const next = [...slots];
      next[index] = blob;
      onSlotsChange(next);
    },
    [slots, onSlotsChange],
  );

  const onPaste =
    (index: number) =>
    (e: React.ClipboardEvent): void => {
      const b = blobFromClipboard(e);
      if (b) {
        e.preventDefault();
        setSlot(index, b);
      }
    };

  const onFile =
    (index: number) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const f = e.target.files?.[0];
      if (f?.type.startsWith("image/")) setSlot(index, f);
      e.target.value = "";
    };

  return (
    <fieldset className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
      <legend className="px-1 text-sm font-medium text-zinc-800">
        Зураг (1 = нүүр) — 5 хэсэг: paste эсвэл файл
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: RECIPE_IMAGE_SLOT_COUNT }, (_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div
              role="textbox"
              tabIndex={0}
              aria-label={`Зургын зай ${i + 1}`}
              onPaste={onPaste(i)}
              className="flex aspect-square cursor-text flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-2 text-center text-xs text-zinc-500 outline-none focus:border-red-400"
            >
              {previews[i] ? (
                <img
                  src={previews[i]}
                  alt=""
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <span>
                  #{i + 1} — фокуслоод <kbd className="rounded bg-zinc-200 px-1">⌘V</kbd>
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <label className="flex-1 cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 py-1 text-center text-xs">
                Файл
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile(i)}
                />
              </label>
              {slots[i] ? (
                <button
                  type="button"
                  onClick={() => setSlot(i, null)}
                  className="rounded-lg border border-zinc-200 px-2 text-xs"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
