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
  return (u ?? "").trim().toLowerCase();
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
    const pu = normUnit(p.unit);
    const iu = normUnit(ing.unit);
    if (pu !== iu) {
      return { ...line, quantity_issue: false };
    }
    if (p.qty + 1e-9 < ing.quantity) {
      pantry_shortfall = true;
      return { ...line, quantity_issue: true };
    }
    return { ...line, quantity_issue: false };
  });
  return { preview: out, pantry_shortfall };
}
