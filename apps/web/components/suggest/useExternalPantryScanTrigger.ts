"use client";

import {
  PANTRY_SCAN_EVENT,
  dataUrlToBlob,
  takePendingPantryScan,
  type PantryScanEventDetail,
} from "@/lib/pantryScanSession";
import { useEffect, useRef } from "react";

/** After stash + navigate from bottom FAB, or CustomEvent while on /suggest. */
export function useExternalPantryScanTrigger(
  run: (blob: Blob) => Promise<void>,
) {
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    let cancel = false;
    (async () => {
      const dataUrl = takePendingPantryScan();
      if (!dataUrl || cancel) return;
      const blob = await dataUrlToBlob(dataUrl);
      if (cancel) return;
      await runRef.current(blob);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    function onEvt(e: Event) {
      const ce = e as CustomEvent<PantryScanEventDetail>;
      if (!ce.detail?.dataUrl) return;
      void (async () => {
        const blob = await dataUrlToBlob(ce.detail.dataUrl);
        await runRef.current(blob);
      })();
    }
    window.addEventListener(PANTRY_SCAN_EVENT, onEvt);
    return () => window.removeEventListener(PANTRY_SCAN_EVENT, onEvt);
  }, []);
}
