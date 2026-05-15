"use client";

import { PantryFabIcon } from "@/components/layout/PantryFabIcon";
import { prepImageBlob } from "@/lib/pantryImage/prepImageBlob";
import {
  PANTRY_SCAN_EVENT,
  stashPendingPantryScan,
  type PantryScanEventDetail,
} from "@/lib/pantryScanSession";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

const primary = "#E23E3E";

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });
}

export function PantryFabButton() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const onSuggest = pathname === "/suggest";

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file?.type.startsWith("image/")) return;
      const blob = await prepImageBlob(file);
      const dataUrl = await readBlobAsDataUrl(blob);
      if (onSuggest) {
        window.dispatchEvent(
          new CustomEvent<PantryScanEventDetail>(PANTRY_SCAN_EVENT, {
            detail: { dataUrl },
          }),
        );
        return;
      }
      stashPendingPantryScan(dataUrl);
      router.push("/suggest");
    },
    [onSuggest, router],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={onFile}
      />
      <button
        type="button"
        aria-label="Зургээр орц тоолж, жор тохируулах — Pantry scan"
        onClick={() => inputRef.current?.click()}
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-rose-400/40 touch-manipulation"
        style={{ backgroundColor: primary }}
      >
        <PantryFabIcon />
      </button>
    </>
  );
}
