import type {
  IngredientPreviewOut,
  SuggestIngRow,
} from "./suggestIngredientPreview";

export type PantryLineIn = {
  canonical_id?: string;
  name: string;
  quantity?: number;
  unit?: string;
};

function normUnit(u: string | undefined): string {
  return (u ?? "").trim().toLowerCase().replace(/\.$/, "");
}
const unitRatios: Record<string, [string, number]> = {
  g: ["mass", 1], gr: ["mass", 1], gram: ["mass", 1], "г": ["mass", 1], "гр": ["mass", 1],
  kg: ["mass", 1000], "кг": ["mass", 1000], mg: ["mass", 0.001], "мг": ["mass", 0.001],
  ml: ["volume", 1], "мл": ["volume", 1], l: ["volume", 1000], "л": ["volume", 1000],
  tsp: ["volume", 5], "цайны халбага": ["volume", 5],
  tbsp: ["volume", 15], "хоолны халбага": ["volume", 15],
  pcs: ["count", 1], piece: ["count", 1], pieces: ["count", 1], "ш": ["count", 1], "ширхэг": ["count", 1],
};

/** Unknown units are not assumed interchangeable. Volume measures are not converted into weights. */
export function comparePantryQuantity(
  pantryQty: number, pantryUnit: string, requiredQty: number, requiredUnit: string,
): "enough" | "shortfall" | "unknown" {
  if (!Number.isFinite(pantryQty) || !Number.isFinite(requiredQty) || pantryQty < 0 || requiredQty < 0) return "unknown";
  const p = normUnit(pantryUnit);
  const r = normUnit(requiredUnit);
  if (p === r) return pantryQty + 1e-9 >= requiredQty ? "enough" : "shortfall";
  const a = unitRatios[p], b = unitRatios[r];
  if (!a || !b || a[0] !== b[0]) return "unknown";
  return pantryQty * a[1] + 1e-9 >= requiredQty * b[1] ? "enough" : "shortfall";
}

export function pantryByCanonical(
  lines: PantryLineIn[],
): Map<string, { qty?: number; unit: string }> {
  const m = new Map<string, { qty?: number; unit: string }>();
  for (const L of lines) {
    if (!L.canonical_id) continue;
    m.set(L.canonical_id, { qty: L.quantity, unit: L.unit ?? "" });
  }
  return m;
}

export function pantryByNameLower(
  lines: PantryLineIn[],
): Map<string, { qty?: number; unit: string }> {
  const m = new Map<string, { qty?: number; unit: string }>();
  for (const L of lines) {
    const k = L.name.toLowerCase().trim();
    if (!k) continue;
    m.set(k, { qty: L.quantity, unit: L.unit ?? "" });
  }
  return m;
}

function pickPantryForIngredient(
  ing: SuggestIngRow,
  byCanon: Map<string, { qty?: number; unit: string }>,
  byName: Map<string, { qty?: number; unit: string }>,
): { qty?: number; unit: string } | undefined {
  if (
    ing.ingredient_canonical_id &&
    byCanon.has(ing.ingredient_canonical_id)
  ) {
    return byCanon.get(ing.ingredient_canonical_id);
  }
  return byName.get(ing.name.toLowerCase().trim());
}

export function enrichPreviewWithPantryQty(
  ings: SuggestIngRow[],
  preview: IngredientPreviewOut[],
  lines: PantryLineIn[],
): { preview: IngredientPreviewOut[]; pantry_shortfall: boolean } {
  if (!lines.length) {
    return {
      preview: preview.map((p) => ({ ...p, quantity_issue: false })),
      pantry_shortfall: false,
    };
  }
  const byCanon = pantryByCanonical(lines);
  const byName = pantryByNameLower(lines);
  let pantry_shortfall = false;
  const out = preview.map((line, i) => {
    const ing = ings[i];
    if (!line.matched) {
      return { ...line, quantity_issue: false };
    }
    const p = pickPantryForIngredient(ing, byCanon, byName);
    if (
      p === undefined ||
      p.qty === undefined ||
      !Number.isFinite(p.qty)
    ) {
      return { ...line, quantity_issue: false };
    }
    const result = comparePantryQuantity(p.qty, p.unit, ing.quantity, ing.unit);
    if (result === "shortfall") pantry_shortfall = true;
    // Unknown unit conversions are flagged for review rather than treated as enough.
    return { ...line, quantity_issue: result !== "enough" };
  });
  return { preview: out, pantry_shortfall };
}
