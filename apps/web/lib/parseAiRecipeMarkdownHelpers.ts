import type { StepRow } from "./adminRecipeTypes";

export type Sec = "ingredients" | "steps" | "description" | "tips" | "skip";

export function headerToSection(header: string): Sec {
  const k = header.trim().toLowerCase();
  if (/ingredient|орц|shopping/i.test(k)) return "ingredients";
  if (/instruct|step|direct|method|алхам|хийх|заавар|procedure/i.test(k))
    return "steps";
  if (/tip|зөвлөгөө|notes?/i.test(k)) return "tips";
  if (/descr|тайлбар|about|overview/i.test(k)) return "description";
  return "skip";
}

/** Strip markdown/boilerplate so "Ingredients:", "**Ingredients**", "# Ingredients" match. */
function normalizePlainSectionHeadingLine(line: string): string {
  return line
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/\*+/g, "")
    .replace(/^[\s\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\uFE0F]+/gu, "")
    .replace(/[:：]+\s*$/, "")
    .trim();
}

export function classifyPlainSectionHeading(line: string): Sec {
  const collapsed = normalizePlainSectionHeadingLine(line);
  if (!collapsed || /^\d/.test(collapsed)) return "skip";
  const lower = collapsed.toLowerCase();
  if (collapsed.length > 48 && !/^(ingredients|ингредиент|ингредиенты|орц|орцны жагсаалт)\b/.test(lower))
    return "skip";
  if (
    lower === "ingredients" ||
    lower === "ингредиент" ||
    lower === "ингредиенты" ||
    lower === "орц" ||
    lower === "орцны жагсаалт"
  )
    return "ingredients";
  if (
    lower === "steps" ||
    lower === "instructions" ||
    lower === "directions" ||
    lower === "method" ||
    lower === "алхам" ||
    lower === "заавар"
  )
    return "steps";
  if (lower === "notes" || lower === "tips" || lower === "зөвлөгөө")
    return "tips";
  if (lower === "description" || lower === "тайлбар") return "description";
  return "skip";
}

/**
 * "Ingredients 300 g …" on one line (common with AI / copy-paste) would exceed
 * the plain-heading length limit and never classify as ingredients — split it.
 */
export function expandInlineIngredientsHeading(line: string): string[] {
  const cleaned = line
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  const forMatch = cleaned.replace(/\*+/g, "").trim();
  const m = forMatch.match(
    /^(?:#+\s*)?(ingredients|ингредиенты?|орц(?:ны\s*жагсаалт)?)\b\s*[.:：\-–—]?\s+([\d½¼⅓⅔⅛¾].*)$/iu,
  );
  if (!m) return [line];
  const rest = m[2].trim();
  if (!rest) return [line];
  return [m[1], rest];
}

/** Avoid treating a quantity-first ingredient line as the recipe title. */
function lineLooksLikeIngredientRow(line: string): boolean {
  const t = line.trim();
  if (!/^[\d½¼⅓⅔⅛¾]/.test(t)) return false;
  return /\b(grams?|teaspoons?|tablespoons?|milliliters?|liters?|cups?|аяга|халбага|г(?:р)?|кг|kg|мл|ml|л|l)\b/i.test(
    t,
  );
}

export function extractTitleAndBody(lines: string[]): { title: string; body: string[] } {
  let title = "";
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].trim();
    if (L.startsWith("# ") && !L.startsWith("## ")) {
      title = L.slice(2).trim();
      start = i + 1;
      break;
    }
  }
  if (!title) {
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i].trim();
      if (!L) continue;
      if (L.startsWith("##")) {
        start = i;
        break;
      }
      if (lineLooksLikeIngredientRow(L)) {
        start = i;
        break;
      }
      title = L.replace(/^#+\s*/, "").slice(0, 200);
      start = i + 1;
      break;
    }
  }
  return { title, body: lines.slice(start) };
}

export function parseStepLine(line: string): string | null {
  const raw = line.trim();
  if (!raw || /^#{1,6}\s/.test(raw)) return null;
  const num = raw.match(/^\d+[\).]\s*(.+)$/);
  if (num) return num[1].trim();
  if (/^[-*•·]\s+/.test(raw)) return raw.replace(/^[-*•·]+\s+/, "").trim();
  if (raw.length > 1) return raw;
  return null;
}

export function parseStepLinesToSteps(stepLines: string[]): StepRow[] {
  const steps: StepRow[] = [];
  let i = 0;
  while (i < stepLines.length) {
    const raw = stepLines[i].trim();
    if (/^\d{1,3}$/.test(raw)) {
      const next = stepLines[i + 1]?.trim() ?? "";
      if (next && !/^#{1,6}\s/.test(next)) {
        steps.push({ description: next });
        i += 2;
        continue;
      }
    }
    const d = parseStepLine(stepLines[i]);
    if (d) steps.push({ description: d });
    i += 1;
  }
  return steps;
}

export function preambleRowsToSkipForDescription(preamble: string[]): Set<number> {
  const skip = new Set<number>();
  for (let i = 0; i < preamble.length; i++) {
    if (/^(?:servings|serving|serves?)$/i.test(preamble[i].trim())) {
      skip.add(i);
      if (
        i + 1 < preamble.length &&
        /^\d+$/.test(preamble[i + 1].trim())
      ) {
        skip.add(i + 1);
      }
    }
  }
  return skip;
}
