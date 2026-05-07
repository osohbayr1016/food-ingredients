import { formatQuantity } from "@/lib/formatQuantity";
import type { IngredientRow } from "@/lib/types";

export type ScaleCtx = {
  factor: number;
};

export function buildIngredientPhrase(ing: IngredientRow, ctx: ScaleCtx) {
  const qty = Number(ing.quantity) * ctx.factor;
  const q = formatQuantity(qty);
  return `${q} ${ing.unit}`.replace(/\s+/g, " ").trim();
}

export function buildSubstitutionMap(items: IngredientRow[], ctx: ScaleCtx) {
  const map: Record<string, string> = {};
  for (const i of items) {
    map[i.id] = buildIngredientPhrase(i, ctx);
  }
  return map;
}
