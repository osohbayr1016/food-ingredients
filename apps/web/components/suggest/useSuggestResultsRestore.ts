"use client";

import type { SuggestResultRow } from "@/components/suggest/suggestTypes";
import { clientFetch } from "@/lib/clientApi";
import { buildSuggestRequestJson, suggestStateSig } from "@/lib/suggestPayload";
import {
  shouldRestoreResults,
  type PantryPick,
  type SuggestUrlFilters,
} from "@/lib/suggestQuery";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { MutableRefObject } from "react";

export function useSuggestResultsRestore(
  searchParams: ReadonlyURLSearchParams,
  pantry: PantryPick[],
  filters: SuggestUrlFilters,
  resultsSigRef: MutableRefObject<string | null>,
  setRows: (rows: SuggestResultRow[]) => void,
  setBusy: (b: boolean) => void,
  setError: (e: string | null) => void,
) {
  useEffect(() => {
    if (!shouldRestoreResults(searchParams)) return;
    if (pantry.length === 0) return;
    const sig = suggestStateSig(pantry, filters);
    if (resultsSigRef.current === sig) return;

    const ac = new AbortController();
    (async () => {
      setBusy(true);
      try {
        const payload = buildSuggestRequestJson(pantry, filters);
        const res = await clientFetch("/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        if (!res.ok) throw new Error("suggest_failed");
        const data = (await res.json()) as { results: SuggestResultRow[] };
        setRows(data.results ?? []);
        setError(null);
        resultsSigRef.current = sig;
      } catch (e: unknown) {
        if (
          ac.signal.aborted ||
          (e instanceof DOMException && e.name === "AbortError")
        ) {
          return;
        }
        setRows([]);
        setError("Санал болгосон жоруудыг сэргээж чадсангүй. Дахин оролдоорой.");
      } finally {
        if (!ac.signal.aborted) setBusy(false);
      }
    })();
    return () => ac.abort();
  }, [searchParams, pantry, filters, resultsSigRef, setRows, setBusy, setError]);
}
