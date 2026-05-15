import type { CanonRow } from "@/lib/pantryImage/sanitizeCanonRows";

const TEMPLATES = [
  "a photo of {}, food ingredient",
  "This is a photo of {}",
];

function uniquePromptTerms(name: string, aliases: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (s: string) => {
    const t = s.trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  for (const a of aliases ?? []) push(a);
  push(name);
  return out;
}

/** English-friendly CLIP lines: aliases first, then canonical display name, multiple templates. */
export function clipPromptLinesForCanon(c: CanonRow): string[] {
  const terms = uniquePromptTerms(c.name, c.aliases);
  const lines = new Set<string>();
  for (const term of terms) {
    for (const tpl of TEMPLATES) lines.add(tpl.replace("{}", term));
  }
  if (!lines.size) lines.add(`a photo of ${c.name}`);
  return [...lines];
}

export function flattenClipPromptPlan(rows: CanonRow[]): {
  prompts: string[];
  canonIndexForPrompt: number[];
} {
  const prompts: string[] = [];
  const canonIndexForPrompt: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (const p of clipPromptLinesForCanon(rows[i]!)) {
      prompts.push(p);
      canonIndexForPrompt.push(i);
    }
  }
  return { prompts, canonIndexForPrompt };
}
