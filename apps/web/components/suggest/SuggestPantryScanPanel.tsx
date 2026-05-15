"use client";

import { SuggestPantryScanActions } from "@/components/suggest/SuggestPantryScanActions";
import { SuggestPantryScanHitRows } from "@/components/suggest/SuggestPantryScanHitRows";
import { useExternalPantryScanTrigger } from "@/components/suggest/useExternalPantryScanTrigger";
import { usePantryImageScan } from "@/components/suggest/usePantryImageScan";
import { useCallback, useEffect, useId, useState } from "react";

const AUTO_SCORE = 0.02;

export function SuggestPantryScanPanel({
  existingIds,
  onAddPicks,
  onAddPicksAndSuggest,
  suggestBusy = false,
}: {
  existingIds: Set<string>;
  onAddPicks: (rows: { canonical_id: string; name: string }[]) => void;
  onAddPicksAndSuggest?: (
    rows: { canonical_id: string; name: string }[],
  ) => Promise<void>;
  suggestBusy?: boolean;
}) {
  const inputId = useId();
  const { status, error, hits, scan, reset } = usePantryImageScan();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  const runFabOrInlineScan = useCallback(
    async (blob: Blob) => {
      setExpanded(true);
      setSelected(new Set());
      await scan(blob, 18);
    },
    [scan],
  );

  useExternalPantryScanTrigger(runFabOrInlineScan);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !f.type.startsWith("image/")) return;
      await runFabOrInlineScan(f);
    },
    [runFabOrInlineScan],
  );

  useEffect(() => {
    if (!hits.length) return;
    const s = new Set<string>();
    for (const h of hits) {
      if (h.score >= AUTO_SCORE && !existingIds.has(h.canonical_id)) {
        s.add(h.canonical_id);
      }
    }
    setSelected(s);
  }, [hits, existingIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const commit = async (withSuggest: boolean) => {
    const rows: { canonical_id: string; name: string }[] = [];
    for (const h of hits) {
      if (selected.has(h.canonical_id))
        rows.push({ canonical_id: h.canonical_id, name: h.name });
    }
    if (!rows.length) return;
    if (withSuggest) {
      if (!onAddPicksAndSuggest) return;
      await onAddPicksAndSuggest(rows);
    } else onAddPicks(rows);
    reset();
    setSelected(new Set());
  };

  const busy = status === "scanning" || suggestBusy;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
            Зурагнаас унших
          </p>
          <p className="text-sm text-zinc-600">
            CLIP зөвхөн орцын төрөл таамаглана; ширхэгийн тоо одоо ≈1 (илүү нарийвчилгаа — object detection).
          </p>
        </div>
        <span className="text-zinc-400">{expanded ? "−" : "+"}</span>
      </button>
      {busy ? (
        <p className="mt-2 text-sm text-zinc-600">Зургийг уншиж, орц таних…</p>
      ) : null}
      {!busy && hits.length > 0 ? (
        <p className="mt-2 text-sm font-semibold text-zinc-800">
          Олдсон орцын төрөл: {hits.length}
        </p>
      ) : null}
      {!busy && error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3">
          <label className="block">
            <span className="sr-only">Зургийн файл</span>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              disabled={status === "scanning"}
              onChange={onFile}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
          </label>
          {hits.length > 0 && status !== "scanning" ? (
            <>
              <p className="text-xs text-zinc-500">
                Softmax каталог дээр. Доор сонгоно уу.
              </p>
              <SuggestPantryScanHitRows
                hits={hits}
                selected={selected}
                existingIds={existingIds}
                onToggle={toggle}
              />
              <SuggestPantryScanActions
                busy={busy}
                canSuggest={!!onAddPicksAndSuggest}
                selectedSize={selected.size}
                onAddOnly={() => void commit(false)}
                onAddAndSuggest={() => void commit(true)}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
