"use client";

import type { SuggestResultRow } from "@/components/suggest/suggestTypes";
import { clientFetch } from "@/lib/clientApi";
import {
  buildSuggestSearch,
  shouldRestoreResults,
  validPicksFromUrl,
} from "@/lib/suggestQuery";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function picksSignature(picks: Set<string>) {
  return [...picks].sort().join("\u0000");
}

export function useSuggestPantryUrl(
  canonicals: { canonical_id: string; name: string }[],
) {
  const pathname = usePathname() ?? "/suggest";
  const router = useRouter();
  const searchParams = useSearchParams();
  const lookup = useMemo(
    () => new Map(canonicals.map((c) => [c.canonical_id, c.name])),
    [canonicals],
  );
  const validIds = useMemo(
    () => new Set(canonicals.map((c) => c.canonical_id)),
    [canonicals],
  );
  const active = useMemo(
    () => validPicksFromUrl(searchParams, validIds),
    [searchParams, validIds],
  );

  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<SuggestResultRow[]>([]);
  const resultsSigRef = useRef<string | null>(null);

  const replaceQuery = useCallback(
    (next: Set<string>, includeResults: boolean) => {
      router.replace(`${pathname}${buildSuggestSearch(next, includeResults)}`, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(active);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setRows([]);
      resultsSigRef.current = null;
      replaceQuery(next, false);
    },
    [active, replaceQuery],
  );

  async function suggest() {
    if (!active.size) return;
    setBusy(true);
    try {
      const names = Array.from(active)
        .map((id) => lookup.get(id) || id)
        .filter(Boolean);
      const res = await clientFetch("/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_names: names }),
      });
      const data = (await res.json()) as { results: SuggestResultRow[] };
      const list = data.results ?? [];
      setRows(list);
      resultsSigRef.current = picksSignature(active);
      replaceQuery(active, true);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!shouldRestoreResults(searchParams)) return;
    const picks = validPicksFromUrl(searchParams, validIds);
    if (picks.size === 0) return;
    const sig = picksSignature(picks);
    if (resultsSigRef.current === sig) return;

    const ac = new AbortController();
    (async () => {
      setBusy(true);
      try {
        const names = Array.from(picks)
          .map((id) => lookup.get(id) || id)
          .filter(Boolean);
        const res = await clientFetch("/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredient_names: names }),
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        const data = (await res.json()) as { results: SuggestResultRow[] };
        setRows(data.results ?? []);
        resultsSigRef.current = sig;
      } catch (e: unknown) {
        if (
          ac.signal.aborted ||
          (e instanceof DOMException && e.name === "AbortError")
        ) {
          return;
        }
        throw e;
      } finally {
        if (!ac.signal.aborted) setBusy(false);
      }
    })();
    return () => ac.abort();
  }, [lookup, searchParams, validIds]);

  return { active, busy, rows, toggle, suggest };
}
