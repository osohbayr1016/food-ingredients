/** Lightweight pantry inventory for one browser/device. No account sync or nutrition inference. */
export const PANTRY_STORAGE_KEY = "food-ingredients-pantry-v1";

export type PantryInventoryItem = {
  canonical_id: string;
  name: string;
  quantity: string;
  unit: string;
  expires_on: string;
};

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizePantry(value: unknown): PantryInventoryItem[] {
  if (!Array.isArray(value)) return [];
  const result: PantryInventoryItem[] = [];
  const ids = new Set<string>();
  for (const raw of value.slice(0, 150)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const canonical_id = typeof item.canonical_id === "string" ? item.canonical_id.trim() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!canonical_id || canonical_id.length > 120 || !name || name.length > 120 || ids.has(canonical_id)) continue;
    const rawQty = typeof item.quantity === "string" || typeof item.quantity === "number" ? String(item.quantity).trim() : "";
    const number = Number(rawQty);
    const quantity = rawQty !== "" && Number.isFinite(number) && number > 0 && number <= 100000 ? rawQty : "";
    const unit = typeof item.unit === "string" ? item.unit.trim().slice(0, 40) : "";
    const rawDate = typeof item.expires_on === "string" ? item.expires_on.trim() : "";
    const expires_on = validDate(rawDate) ? rawDate : "";
    result.push({ canonical_id, name, quantity, unit, expires_on });
    ids.add(canonical_id);
    if (result.length === 100) break;
  }
  return result;
}

export function parsePantryStorage(raw: string | null): PantryInventoryItem[] {
  if (!raw) return [];
  try { return normalizePantry(JSON.parse(raw)); }
  catch { return []; }
}

export function expiryStatus(expiresOn: string, today: string): "none" | "expired" | "soon" | "fresh" {
  if (!validDate(expiresOn) || !validDate(today)) return "none";
  const remaining = Math.floor((Date.parse(expiresOn + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000);
  if (remaining < 0) return "expired";
  if (remaining <= 3) return "soon";
  return "fresh";
}

export function usablePantry(items: PantryInventoryItem[], today: string): PantryInventoryItem[] {
  return normalizePantry(items).filter(x => expiryStatus(x.expires_on, today) !== "expired");
}

export function todayLocalIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
