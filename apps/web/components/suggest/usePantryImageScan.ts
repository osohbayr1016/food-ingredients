"use client";

import { fetchIngredientCanonicals } from "@/lib/pantryImage/fetchIngredientCanonicals";
import {
  runPantryImageScan,
  type PantryScanHit,
} from "@/lib/pantryImage/runPantryImageScan";
import { useCallback, useState } from "react";

type Status = "idle" | "scanning" | "done" | "error";

export function usePantryImageScan() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<PantryScanHit[]>([]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setHits([]);
  }, []);

  const scan = useCallback(async (file: Blob, topK = 18) => {
    setError(null);
    setHits([]);
    setStatus("scanning");
    try {
      const canon = await fetchIngredientCanonicals();
      const out = await runPantryImageScan(file, canon, { topK });
      setHits(out);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
      setStatus("error");
    }
  }, []);

  return { status, error, hits, scan, reset };
}
