"use client";

import { useSuggestPantryBatch } from "@/components/suggest/useSuggestPantryBatch";
import type { SuggestResultRow } from "@/components/suggest/suggestTypes";
import { postSuggestPantryResults } from "@/lib/postSuggestPantry";
import { suggestStateSig } from "@/lib/suggestPayload";
import {
  applySuggestFilterPatch,
  buildSuggestQueryString,
  filtersFromUrl,
  type PantryPick,
  picksFromUrl,
  type SuggestUrlFilters,
} from "@/lib/suggestQuery";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSuggestResultsRestore } from "@/components/suggest/useSuggestResultsRestore";

export function useSuggestPantryUrl() {
  const pathname = usePathname() ?? "/suggest";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pantry = useMemo(
    () => picksFromUrl(searchParams),
    [searchParams],
  );
  const filters = useMemo(
    () => filtersFromUrl(searchParams),
    [searchParams],
  );

  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<SuggestResultRow[]>([]);
  const resultsSigRef = useRef<string | null>(null);

  const replaceQuery = useCallback(
    (
      nextPantry: PantryPick[],
      nextFilters: SuggestUrlFilters,
      includeResults: boolean,
    ) => {
      router.replace(
        `${pathname}${buildSuggestQueryString(nextPantry, includeResults, nextFilters)}`,
        { scroll: false },
      );
    },
    [pathname, router],
  );

  const addPick = useCallback(
    (row: { canonical_id: string; name: string }) => {
      if (pantry.some((p) => p.canonical_id === row.canonical_id)) return;
      const next: PantryPick[] = [
        ...pantry,
        {
          canonical_id: row.canonical_id,
          name: row.name,
          quantity: "",
          unit: "",
        },
      ];
      setRows([]);
      resultsSigRef.current = null;
      replaceQuery(next, filters, false);
    },
    [pantry, filters, replaceQuery],
  );

  const removePick = useCallback(
    (canonicalId: string) => {
      const next = pantry.filter((p) => p.canonical_id !== canonicalId);
      setRows([]);
      resultsSigRef.current = null;
      replaceQuery(next, filters, false);
    },
    [pantry, filters, replaceQuery],
  );

  const updatePick = useCallback(
    (
      canonicalId: string,
      patch: Partial<Pick<PantryPick, "quantity" | "unit" | "name">>,
    ) => {
      const next = pantry.map((p) =>
        p.canonical_id === canonicalId ? { ...p, ...patch } : p,
      );
      setRows([]);
      resultsSigRef.current = null;
      replaceQuery(next, filters, false);
    },
    [pantry, filters, replaceQuery],
  );

  const setFilterPatch = useCallback(
    (patch: Partial<SuggestUrlFilters>) => {
      const next = applySuggestFilterPatch(filters, patch);
      setRows([]);
      resultsSigRef.current = null;
      replaceQuery(pantry, next, false);
    },
    [pantry, filters, replaceQuery],
  );

  const { addMultiplePicks, addPicksAndSuggest } = useSuggestPantryBatch(
    pantry,
    filters,
    replaceQuery,
    setRows,
    resultsSigRef,
    setBusy,
  );

  async function suggest() {
    if (!pantry.length) return;
    setBusy(true);
    try {
      const list = await postSuggestPantryResults(pantry, filters);
      setRows(list);
      resultsSigRef.current = suggestStateSig(pantry, filters);
      replaceQuery(pantry, filters, true);
    } finally {
      setBusy(false);
    }
  }

  useSuggestResultsRestore(
    searchParams,
    pantry,
    filters,
    resultsSigRef,
    setRows,
    setBusy,
  );

  return {
    pantry,
    filters,
    busy,
    rows,
    addPick,
    addMultiplePicks,
    addPicksAndSuggest,
    removePick,
    updatePick,
    setFilterPatch,
    suggest,
  };
}
