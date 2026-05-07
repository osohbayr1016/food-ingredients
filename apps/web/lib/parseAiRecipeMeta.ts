import type { RecipeRow } from "./adminRecipeTypes";
import {
  classifyPlainSectionHeading,
  expandInlineIngredientsHeading,
  headerToSection,
} from "./parseAiRecipeMarkdownHelpers";

export function normalizeMetaLine(line: string): string {
  return line.replace(/\*+/g, "").replace(/\s+/g, " ").trim();
}

function trimMetaValue(s: string): string {
  return s.split("|")[0].replace(/\*+/g, "").trim();
}

/** All body lines until first Ingredients heading (## or plain). */
export function linesBeforeFirstIngredientsSection(body: string[]): string[] {
  const acc: string[] = [];
  const lines = body.flatMap(expandInlineIngredientsHeading);
  for (const line of lines) {
    const h2 = line.match(/^##\s*(.+)\s*$/);
    if (h2 && headerToSection(h2[1].trim()) === "ingredients") break;
    const plain = classifyPlainSectionHeading(line);
    if (plain === "ingredients") break;
    acc.push(line);
  }
  return acc;
}

export function applyMetaLine(line: string, r: Partial<RecipeRow>) {
  const trim = normalizeMetaLine(line);
  if (!trim || /^#{1,6}\s/.test(trim)) return;

  const prep =
    trim.match(/бэлтгэх(?:\s*хугацаа)?\s*[:：]?\s*(\d+)\s*(?:мин|min|minutes)?/i) ||
    trim.match(/⏱️\s*бэлтгэх\s*[:：]?\s*(\d+)/i) ||
    trim.match(
      /\bprep(?:\s*time)?\s*[:：]?\s*(\d+)\s*(?:min(?:utes)?|minutes|мин|цаг)?\b/i,
    ) ||
    trim.match(/бэлтгэх\s*[:：]\s*(\d+)/i);
  if (prep) r.prep_time = Math.max(0, parseInt(prep[1], 10));

  const cook =
    trim.match(/жигнэх(?:\s*хугацаа)?\s*[:：]?\s*(\d+)\s*(?:мин|min|minutes)?/i) ||
    trim.match(/🔥\s*жигнэх\s*[:：]?\s*(\d+)/i) ||
    trim.match(
      /\bcook(?:\s*time)?\s*[:：]?\s*(\d+)\s*(?:min(?:utes)?|minutes|мин|цаг)?\b/i,
    ) ||
    trim.match(/чанах\s*[:：]\s*(\d+)/i);
  if (cook) r.cook_time = Math.max(0, parseInt(cook[1], 10));

  const mnOrigin = trim.match(
    /гарал\s*ү+сэл\s*[:：]\s*([^|]+)/i,
  );
  if (mnOrigin) r.cuisine = trimMetaValue(mnOrigin[1]);

  const srv =
    trim.match(/\b(?:servings|serving|serves?)\s*[:：]\s*(\d+)/i) ||
    trim.match(/хүнс\s*[:：]\s*(\d+)/i);
  if (srv) r.serves = Math.max(1, parseInt(srv[1], 10));

  const cu = trim.match(/\bcuisine\s*[:：]\s*(.+)$/i);
  if (cu) r.cuisine = trimMetaValue(cu[1]);

  const ori = trim.match(/\borigin\s*[:：]\s*(.+)$/i);
  if (ori) r.cuisine = trimMetaValue(ori[1]);

  const from = trim.match(/\bfrom\s*[:：]\s*(.+)$/i);
  if (from && String(r.cuisine || "").trim() === "General")
    r.cuisine = trimMetaValue(from[1]);

  const diff = trim.match(/\bdifficulty\s*[:：]\s*(\d+)/i);
  if (diff)
    r.difficulty = Math.min(3, Math.max(1, parseInt(diff[1], 10)));
  if (/\beasy\b|хялбар/i.test(trim)) r.difficulty = 1;
  if (/\bhard\b|хэцүү/i.test(trim)) r.difficulty = 3;
}

export function applyMetaFromLines(lines: string[], r: Partial<RecipeRow>) {
  for (let i = 0; i < lines.length; i++) {
    applyMetaLine(lines[i], r);
    const t = normalizeMetaLine(lines[i]);
    if (/^(?:servings|serving|serves?)$/i.test(t)) {
      let j = i + 1;
      while (j < lines.length && !normalizeMetaLine(lines[j])) j += 1;
      const n = parseInt(normalizeMetaLine(lines[j] ?? ""), 10);
      if (Number.isFinite(n)) r.serves = Math.max(1, n);
    }
  }
}
