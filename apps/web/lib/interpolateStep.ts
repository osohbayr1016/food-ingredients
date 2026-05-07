export function interpolateStep(text: string, map: Record<string, string>) {
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, raw) => {
    const key = String(raw).trim();
    const v = map[key];
    return v !== undefined ? v : `{{${key}}}`;
  });
}
