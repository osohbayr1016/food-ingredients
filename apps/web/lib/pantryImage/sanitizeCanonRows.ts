export type CanonRow = { canonical_id: string; name: string; aliases?: string[] };

function parseAliases(row: Record<string, unknown>): string[] {
  const direct = row.aliases;
  if (Array.isArray(direct)) {
    const xs: string[] = [];
    for (const a of direct) {
      if (typeof a === "string" && a.trim()) xs.push(a.trim());
    }
    return xs;
  }
  const joined = row.aliases_joined;
  if (typeof joined === "string" && joined.length) {
    return joined.split("|||").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function sanitizeCanonRows(rows: unknown): CanonRow[] {
  if (!Array.isArray(rows)) return [];
  const out: CanonRow[] = [];
  for (const r of rows) {
    if (r == null || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    const id =
      typeof row.canonical_id === "string"
        ? row.canonical_id.trim()
        : String(row.canonical_id ?? "").trim();
    const name =
      typeof row.name === "string" ? row.name.trim() : String(row.name ?? "").trim();
    if (!id || !name) continue;
    const aliases = parseAliases(row);
    out.push(aliases.length ? { canonical_id: id, name, aliases } : { canonical_id: id, name });
  }
  return out;
}
