"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  pending?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Тийм",
  cancelLabel = "Цуцлах",
  onConfirm,
  onCancel,
  pending = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        aria-label="Хаах"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={() => !pending && onCancel()}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-zinc-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void onConfirm()}
            className="rounded-xl bg-[#E23E3E] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Устгаж байна…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
