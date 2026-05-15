/** Cross-route handoff: bottom-nav FAB → /suggest auto-scan (sessionStorage). */

export const PANTRY_SCAN_STORAGE_KEY = "fi_pending_pantry_scan_v1";

/** Fired when user picks a photo while already on /suggest (same-route handoff). */
export const PANTRY_SCAN_EVENT = "fi-pantry-scan-pending";

export type PantryScanEventDetail = { dataUrl: string };

export function stashPendingPantryScan(dataUrl: string) {
  sessionStorage.setItem(PANTRY_SCAN_STORAGE_KEY, dataUrl);
}

/** Returns and clears the pending data URL, if any. */
export function takePendingPantryScan(): string | null {
  const v = sessionStorage.getItem(PANTRY_SCAN_STORAGE_KEY);
  if (v) sessionStorage.removeItem(PANTRY_SCAN_STORAGE_KEY);
  return v;
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
