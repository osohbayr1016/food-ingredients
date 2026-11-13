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
  if (!p || !r) return "unknown";
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

/** Convert stock to recipe unit, without guessing density or missing units. */
function inRequiredUnit(qty: number, stockUnit: string, recipeUnit: string): number | null {
  const a = normUnit(stockUnit), b = normUnit(recipeUnit);
  if (!a || !b || !Number.isFinite(qty) || qty < 0) return null;
  if (a === b) return qty;
  const x = unitRatios[a], y = unitRatios[b];
  if (!x || !y || x[0] !== y[0]) return null;
  return qty * x[1] / y[1];
}

export type QuantityStatus = "enough" | "shortfall" | "unknown" | "missing";

/**
 * Consume quantities at most once, even when the same ingredient occurs
 * multiple times within a recipe. Unknown amounts never count as sufficient.
 */
export function enrichPreviewWithPantryQty(
  ings: SuggestIngRow[],
  preview: IngredientPreviewOut[],
  lines: PantryLineIn[],
): { preview: IngredientPreviewOut[]; pantry_shortfall: boolean } {
  const stock = lines.map(line => ({
    canonical_id: line.canonical_id ?? "",
    name: line.name.toLowerCase().trim(),
    unit: line.unit ?? "",
    left: line.quantity,
  }));
  let pantry_shortfall = false;
  const out = preview.map((line, i) => {
    const ing = ings[i];
    if (!line.matched) {
      return { ...line, quantity_status: "missing" as const, quantity_issue: true };
    }
    const matchedByCanonical = ing.ingredient_canonical_id
      ? stock.filter(s => s.canonical_id === ing.ingredient_canonical_id) : [];
    const candidates = matchedByCanonical.length ? matchedByCanonical
      : stock.filter(s => s.name === ing.name.toLowerCase().trim());
    if (!candidates.length) {
      return { ...line, quantity_status: "unknown" as const, quantity_issue: true };
    }
    let needed = ing.quantity;
    let hasUnknown = false;
    for (const item of candidates) {
      if (item.left == null) { hasUnknown = true; continue; }
      const available = inRequiredUnit(item.left, item.unit, ing.unit);
      if (available == null) { hasUnknown = true; continue; }
      const used = Math.min(needed, available);
      needed -= used;
      if (used > 0) {
        const consumed = inRequiredUnit(used, ing.unit, item.unit);
        if (consumed != null) item.left = Math.max(0, item.left - consumed);
      }
      if (needed <= 1e-9) break;
    }
    const quantity_status: QuantityStatus =
      needed <= 1e-9 ? "enough" : hasUnknown ? "unknown" : "shortfall";
    if (quantity_status === "shortfall") pantry_shortfall = true;
    return { ...line, quantity_status, quantity_issue: quantity_status !== "enough" };
  });
  return { preview: out, pantry_shortfall };
}
