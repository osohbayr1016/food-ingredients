/** Normalize D1 / SQLite driver errors to a single message string. */
export function d1ErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e)
    return String((e as { message: unknown }).message);
  return String(e);
}

export function isD1UniqueConstraintOnUsers(e: unknown): boolean {
  const m = d1ErrorMessage(e);
  if (!/UNIQUE constraint failed/i.test(m)) return false;
  return /\busers\b/i.test(m);
}

export function isD1NoSuchTableUsers(e: unknown): boolean {
  const m = d1ErrorMessage(e);
  return /no such table/i.test(m) && /\busers\b/i.test(m);
}
