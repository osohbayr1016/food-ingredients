/** Quantity: decimals or common vulgar fractions (copy/paste from recipes). */
export const QTY_PATTERN = "(?:\\d+(?:[.,]\\d+)?|½|¼|⅓|⅔|⅛|¾)";

/** Non-capturing: embedding as (${UNIT_PATTERN}) must yield a single capture. */
export const UNIT_PATTERN =
  "(?:tea\\s*-?\\s*spoons?|tablespoons?|teaspoons?|milliliters?|liters?|grams?|spoons?|гр\\.?|г|кг|kg|мл|ml|л|l|ш\\.?|pcs?|cup|cups|tbsp|tsp|хоолны\\s*халбага|цайны\\s*халбага|аяга|халбага|удаа|удахгүй)";

const STANDALONE_UNIT_NOISE =
  /^(?:grams?|грамм|грам|teaspoons?|tablespoons?|milliliters?|liters?|литр|litres?|tsp|tbsp|spoons?|kg|г(?:р)?|мл|л|ш|cup|cups)$/i;

const FRAC: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "¾": 0.75,
};

export function parseQtyToken(q: string): number {
  const t = q.trim().replace(",", ".");
  if (FRAC[t] !== undefined) return FRAC[t];
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function isStandaloneUnitNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  return STANDALONE_UNIT_NOISE.test(t);
}

export function normalizeIngredientUnit(u: string): string {
  const t = u
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (/^tea-?spoons?$|^tea spoons?$/.test(t)) return "tsp";
  if (/^teaspoons?$|^tsp$/.test(t)) return "tsp";
  if (/^tablespoons?$|^tbsp$/.test(t)) return "tbsp";
  if (/^grams?$/.test(t)) return "г";
  if (/^milliliters?$/.test(t)) return "мл";
  if (/^liters?$/.test(t)) return "л";
  if (/^spoons?$/.test(t)) return "tsp";
  if (/^cups?$/.test(t)) return "аяга";
  return u.trim();
}

/** Two-column copy: first cell is only "grams", second is "150 g …". */
const LEADING_UNIT_COL = new RegExp(
  `^(?:grams?|грамм|грам|teaspoons?|tablespoons?|milliliters?|литр|liters?)\\s+(.+)$`,
  "i",
);

export function stripLeadingUnitColumnLine(line: string): string {
  const t = line
    .trim()
    .replace(/\t+/g, " ")
    .replace(/\s+/g, " ");
  const m = t.match(LEADING_UNIT_COL);
  if (!m) return t;
  const rest = m[1].trim();
  if (/^[\d½¼⅓⅔⅛¾]/.test(rest)) return rest;
  return t;
}

function skipNoise(raw: string[], i: number): number {
  let j = i;
  while (j < raw.length && isStandaloneUnitNoiseLine(raw[j])) j++;
  return j;
}

export function isUnitLikeIngredientName(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  const first = t.split(/\s+/)[0] ?? "";
  if (isStandaloneUnitNoiseLine(first)) return true;
  if (isStandaloneUnitNoiseLine(t)) return true;
  return false;
}

const qtyUnitOnlyRe = new RegExp(
  `^(${QTY_PATTERN})\\s*(${UNIT_PATTERN})\\s*$`,
  "i",
);

const qtyUnitNameRe = new RegExp(
  `^(${QTY_PATTERN})\\s*(${UNIT_PATTERN})\\s+(.+)$`,
  "i",
);

function looksLikeNameLine(s: string): boolean {
  const t = s.trim();
  if (!t || isStandaloneUnitNoiseLine(t)) return false;
  if (qtyUnitOnlyRe.test(t)) return false;
  if (qtyUnitNameRe.test(t)) return false;
  return /\p{L}/u.test(t);
}

export function coalesceIngredientLines(lines: string[]): string[] {
  const raw = lines
    .map((l) => stripLeadingUnitColumnLine(l.trim()))
    .filter((t) => t.length > 0);
  const out: string[] = [];
  let i = 0;
  while (i < raw.length) {
    i = skipNoise(raw, i);
    if (i >= raw.length) break;

    const t = raw[i];

    if (qtyUnitNameRe.test(t)) {
      out.push(t);
      i += 1;
      continue;
    }

    const m = t.match(qtyUnitOnlyRe);
    if (m) {
      const j = skipNoise(raw, i + 1);
      if (j < raw.length && looksLikeNameLine(raw[j])) {
        out.push(`${t} ${raw[j]}`);
        i = j + 1;
        continue;
      }
      i += 1;
      continue;
    }

    out.push(t);
    i += 1;
  }
  return out;
}
