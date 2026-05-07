"use client";

import { useEffect } from "react";

export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lock: WakeLockSentinel | null = null;
    if (navigator.wakeLock?.request) {
      navigator.wakeLock.request("screen").then((l) => (lock = l));
    }
    return () => {
      lock?.release().catch(() => {});
    };
  }, [enabled]);
}
