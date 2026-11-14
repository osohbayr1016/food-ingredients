/** Bounds on admin-facing requests avoid accidental DB errors and unbounded upstream calls. */
export function parseTagName(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u001F\u007F]/.test(value)) return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 80 && !/[\u0000-\u001F\u007F]/.test(name)
    ? name : null;
}

export function parseMealDbId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return /^\d{1,20}$/.test(id) ? id : null;
}

export function parseMealDbSearchQuery(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u001F\u007F]/.test(value)) return null;
  const query = value.trim().replace(/\s+/g, " ");
  return query.length >= 1 && query.length <= 80 &&
    !/[\u0000-\u001F\u007F]/.test(query) ? query : null;
}
