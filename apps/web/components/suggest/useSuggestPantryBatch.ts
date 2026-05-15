"use client";

import type { SuggestResultRow } from "@/components/suggest/suggestTypes";
import { postSuggestPantryResults } from "@/lib/postSuggestPantry";
import { mergePantryPicks } from "@/lib/suggestPantryMerge";
import { suggestStateSig } from "@/lib/suggestPayload";
import type { PantryPick, SuggestUrlFilters } from "@/lib/suggestQuery";
import { useCallback, type MutableRefObject } from "react";

export function useSuggestPantryBatch(
  pantry: PantryPick[],
  filters: SuggestUrlFilters,
  replaceQuery: (
    nextPantry: PantryPick[],
    nextFilters: SuggestUrlFilters,
    includeResults: boolean,
  ) => void,
  setRows: (r: SuggestResultRow[]) => void,
  resultsSigRef: MutableRefObject<string | null>,
  setBusy: (b: boolean) => void,
) {
  const addMultiplePicks = useCallback(
    (newRows: { canonical_id: string; name: string }[]) => {
      if (!newRows.length) return;
      const next = mergePantryPicks(pantry, newRows);
      if (next.length === pantry.length) return;
      setRows([]);
      resultsSigRef.current = null;
      replaceQuery(next, filters, false);
    },
    [pantry, filters, replaceQuery, setRows, resultsSigRef],
  );

  const addPicksAndSuggest = useCallback(
    async (newRows: { canonical_id: string; name: string }[]) => {
      if (!newRows.length) return;
      const next = mergePantryPicks(pantry, newRows);
      if (!next.length) return;
      setRows([]);
      resultsSigRef.current = null;
      replaceQuery(next, filters, false);
      setBusy(true);
      try {
        const list = await postSuggestPantryResults(next, filters);
        setRows(list);
        resultsSigRef.current = suggestStateSig(next, filters);
        replaceQuery(next, filters, true);
      } finally {
        setBusy(false);
      }
    },
    [
      pantry,
      filters,
      replaceQuery,
      setRows,
      resultsSigRef,
      setBusy,
    ],
  );

  return { addMultiplePicks, addPicksAndSuggest };
}
