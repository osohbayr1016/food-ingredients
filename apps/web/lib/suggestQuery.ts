/** Pantry match URL: repeatable `pick`, optional `r=1` when results were loaded. */

export function validPicksFromUrl(
  searchParams: Pick<URLSearchParams, "getAll">,
  allowed: Set<string>,
): Set<string> {
  const out = new Set<string>();
  for (const p of searchParams.getAll("pick")) {
    if (allowed.has(p)) out.add(p);
  }
  return out;
}

export function buildSuggestSearch(
  active: Set<string>,
  includeResults: boolean,
): string {
  const q = new URLSearchParams();
  for (const id of [...active].sort()) q.append("pick", id);
  if (includeResults && active.size > 0) q.set("r", "1");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function shouldRestoreResults(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return searchParams.get("r") === "1";
}
