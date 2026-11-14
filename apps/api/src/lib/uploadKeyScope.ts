/** Keep uploaded object keys within a single safe recipes/<id>/ namespace. */
export function safeRecipeUploadScope(value: unknown): string | null {
  if (value == null || value === "") return "draft";
  if (typeof value !== "string") return null;
  const id = value.trim();
  return /^[A-Za-z0-9_-]{1,150}$/.test(id) ? id : null;
}
