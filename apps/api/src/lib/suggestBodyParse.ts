import type { PantryLineIn } from "./pantryQuantity";

export type SuggestFilters = {
  max_total_minutes?: number;
  max_difficulty?: number;
  min_serves?: number;
  max_serves?: number;
};

export function sqlPlaceholders(n: number) {
  return n ? `(${Array.from({ length: n }, () => "?").join(",")})` : "(NULL)";
}

function normNames(body: unknown) {
  const arr =
    body && typeof body === "object" && "ingredient_names" in body
      ? (body as { ingredient_names?: unknown }).ingredient_names
      : [];
  const list = Array.isArray(arr) ? arr.slice(0, 30).filter(x => typeof x === "string" && x.length <= 120) : [];
  const set = list.map((s) => s.toLowerCase().trim()).filter(Boolean);
  return [...new Set(set)];
}

export function parsePantry(body: unknown): PantryLineIn[] {
  if (!body || typeof body !== "object" || !("pantry" in body)) return [];
  const raw = (body as { pantry?: unknown }).pantry;
  if (!Array.isArray(raw)) return [];
  const out: PantryLineIn[] = [];
  for (const x of raw.slice(0, 30)) {
    if (!x || typeof x !== "object") continue;
    const r = x as Record<string, unknown>;
    // Do not coerce arbitrary JSON objects: String({toString:null}) can throw.
    const name = typeof r.name === "string" ? r.name.trim() : "";
    const canonical_id =
      typeof r.canonical_id === "string" && r.canonical_id.trim()
        ? r.canonical_id.trim()
        : undefined;
    if ((!name && !canonical_id) || name.length > 120 || (canonical_id && canonical_id.length > 120)) continue;
    let quantity: number | undefined;
    if ((typeof r.quantity === "string" || typeof r.quantity === "number") &&
        r.quantity !== "") {
      const n = Number(r.quantity);
      if (Number.isFinite(n) && n > 0 && n <= 100000) quantity = n;
    }
    const unit = typeof r.unit === "string" ? r.unit.trim().slice(0, 40) : "";
    out.push({
      canonical_id,
      name,
      quantity,
      unit,
    });
  }
  return out;
}

export function parseFilters(body: unknown): SuggestFilters {
  if (!body || typeof body !== "object" || !("filters" in body)) return {};
  const f = (body as { filters?: unknown }).filters;
  if (!f || typeof f !== "object" || Array.isArray(f)) return {};
  const o = f as Record<string, unknown>;
  const pick = (k: string) => {
    const v = o[k];
    if (v == null || v === "") return undefined;
    if (typeof v !== "string" && typeof v !== "number") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    max_total_minutes: ((v) => v != null && v >= 1 && v <= 1440 ? v : undefined)(pick("max_total_minutes")),
    max_difficulty: ((v) => v != null && Number.isInteger(v) && v >= 1 && v <= 3 ? v : undefined)(pick("max_difficulty")),
    min_serves: ((v) => v != null && Number.isInteger(v) && v >= 1 && v <= 100 ? v : undefined)(pick("min_serves")),
    max_serves: ((v) => v != null && Number.isInteger(v) && v >= 1 && v <= 100 ? v : undefined)(pick("max_serves")),
  };
}

function mergeNames(names: string[], pantry: PantryLineIn[]): string[] {
  const fromPantry = pantry
    .map((p) => p.name.toLowerCase().trim())
    .filter(Boolean);
  return [...new Set([...names, ...fromPantry])];
}

export function mergedNormNames(
  legacyNames: string[],
  pantry: PantryLineIn[],
): string[] {
  return mergeNames(legacyNames, pantry);
}

export function parseSuggestInput(body: unknown): {
  legacyNames: string[];
  pantry: PantryLineIn[];
  filters: SuggestFilters;
} | null {
  const pantry = parsePantry(body);
  const filters = parseFilters(body);
  const legacyNames = normNames(body);
  if (!legacyNames.length && !pantry.length) return null;
  return { legacyNames, pantry, filters };
}

/** Request filter validation: bad inputs should not silently loosen recipe constraints. */
export function validateSuggestFilters(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const filters = (body as Record<string, unknown>).filters;
  if (filters == null) return true;
  if (typeof filters !== "object" || Array.isArray(filters)) return false;
  const data = filters as Record<string, unknown>;
  const specs = [
    ["max_total_minutes", 1, 1440, false],
    ["max_difficulty", 1, 3, true],
    ["min_serves", 1, 100, true],
    ["max_serves", 1, 100, true],
  ] as const;
  const numbers = new Map<string, number>();
  for (const [key, min, max, integerOnly] of specs) {
    const raw = data[key];
    if (raw == null || raw === "") continue;
    if (typeof raw !== "string" && typeof raw !== "number") return false;
    if (typeof raw === "string" && !/^\d+(?:\.\d+)?$/.test(raw.trim())) return false;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < min || n > max ||
        (integerOnly && !Number.isSafeInteger(n))) return false;
    numbers.set(key,n);
  }
  const minServes = numbers.get("min_serves");
  const maxServes = numbers.get("max_serves");
  return minServes === undefined || maxServes === undefined || minServes <= maxServes;
}
