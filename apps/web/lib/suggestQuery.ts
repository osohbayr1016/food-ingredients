/** Pantry URL: repeatable `pick`, optional `r=1`, filter keys `tmax`, `dmax`, `smin`, `smax`. */

export type PantryPick = {
  canonical_id: string;
  name: string;
  quantity: string;
  unit: string;
};

export type SuggestUrlFilters = {
  max_total_minutes?: number;
  max_difficulty?: number;
  min_serves?: number;
  max_serves?: number;
};

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Legacy `pick=id` and extended `pick=id|qty|unitEnc|nameEnc`. */
export function parsePickParam(raw: string): PantryPick | null {
  const v = raw.trim();
  if (!v) return null;
  const parts = v.split("|");
  const id = (parts[0] ?? "").trim();
  if (!id) return null;
  if (parts.length === 1) {
    return { canonical_id: id, quantity: "", unit: "", name: "" };
  }
  const qty = parts[1] ?? "";
  if (parts.length === 2) {
    return { canonical_id: id, quantity: qty, unit: "", name: "" };
  }
  const unit = safeDecode(parts[2] ?? "");
  if (parts.length === 3) {
    return { canonical_id: id, quantity: qty, unit, name: "" };
  }
  const name = safeDecode(parts.slice(3).join("|"));
  return { canonical_id: id, quantity: qty, unit, name };
}

export function serializePick(p: PantryPick): string {
  if (!p.quantity && !p.unit && !p.name) return p.canonical_id;
  const u = encodeURIComponent(p.unit);
  if (!p.name) {
    if (!p.quantity && !p.unit) return p.canonical_id;
    return `${p.canonical_id}|${p.quantity}|${u}`;
  }
  const n = encodeURIComponent(p.name);
  return `${p.canonical_id}|${p.quantity}|${u}|${n}`;
}

export function picksFromUrl(
  searchParams: Pick<URLSearchParams, "getAll">,
): PantryPick[] {
  const out: PantryPick[] = [];
  for (const raw of searchParams.getAll("pick")) {
    const row = parsePickParam(raw);
    if (row) out.push(row);
  }
  return dedupePantryById(out);
}

function dedupePantryById(rows: PantryPick[]): PantryPick[] {
  const seen = new Set<string>();
  const rev: PantryPick[] = [];
  for (const r of rows) {
    if (seen.has(r.canonical_id)) continue;
    seen.add(r.canonical_id);
    rev.push(r);
  }
  return rev;
}

function numFromSp(
  sp: Pick<URLSearchParams, "get">,
  key: string,
): number | undefined {
  const v = sp.get(key);
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function filtersFromUrl(
  searchParams: Pick<URLSearchParams, "get">,
): SuggestUrlFilters {
  return {
    max_total_minutes: numFromSp(searchParams, "tmax"),
    max_difficulty: numFromSp(searchParams, "dmax"),
    min_serves: numFromSp(searchParams, "smin"),
    max_serves: numFromSp(searchParams, "smax"),
  };
}

export function buildSuggestQueryString(
  picks: PantryPick[],
  includeResults: boolean,
  filters: SuggestUrlFilters,
): string {
  const q = new URLSearchParams();
  const sorted = [...picks].sort((a, b) =>
    a.canonical_id.localeCompare(b.canonical_id),
  );
  for (const p of sorted) q.append("pick", serializePick(p));
  if (includeResults && picks.length > 0) q.set("r", "1");
  if (filters.max_total_minutes != null) {
    q.set("tmax", String(filters.max_total_minutes));
  }
  if (filters.max_difficulty != null) {
    q.set("dmax", String(filters.max_difficulty));
  }
  if (filters.min_serves != null) q.set("smin", String(filters.min_serves));
  if (filters.max_serves != null) q.set("smax", String(filters.max_serves));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function shouldRestoreResults(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return searchParams.get("r") === "1";
}

export function applySuggestFilterPatch(
  prev: SuggestUrlFilters,
  patch: Partial<SuggestUrlFilters>,
): SuggestUrlFilters {
  const keys: (keyof SuggestUrlFilters)[] = [
    "max_total_minutes",
    "max_difficulty",
    "min_serves",
    "max_serves",
  ];
  const out: SuggestUrlFilters = {};
  for (const k of keys) {
    if (k in patch) {
      const v = patch[k];
      if (v != null && Number.isFinite(v)) {
        out[k] = v;
      }
    } else if (prev[k] != null && Number.isFinite(prev[k]!)) {
      out[k] = prev[k]!;
    }
  }
  return out;
}

/** @deprecated use picksFromUrl — kept for any external import */
export function validPicksFromUrl(
  searchParams: Pick<URLSearchParams, "getAll">,
  allowed: Set<string>,
): Set<string> {
  const out = new Set<string>();
  for (const p of picksFromUrl(searchParams)) {
    if (allowed.has(p.canonical_id)) out.add(p.canonical_id);
  }
  return out;
}

export function buildSuggestSearch(
  active: Set<string>,
  includeResults: boolean,
): string {
  const picks: PantryPick[] = [...active].sort().map((canonical_id) => ({
    canonical_id,
    name: "",
    quantity: "",
    unit: "",
  }));
  return buildSuggestQueryString(picks, includeResults, {});
}
