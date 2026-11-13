/** Meal-planning arithmetic: do not infer density or unknown package sizes. */

export type ShoppingIngredient = {
  ingredient_canonical_id?: string | null;
  name: string;
  quantity: number;
  unit: string;
};
export type ShoppingRecipe = {
  ingredients: ShoppingIngredient[];
  baseServes: number;
  plannedServes: number;
};
export type ShoppingStock = {
  canonical_id: string;
  name: string;
  quantity: string;
  unit: string;
};
export type ShoppingLine = {
  key: string;
  name: string;
  unit: string;
  quantity: number;
  stockUncertain: boolean;
};

const UNITS: Record<string, { kind: string; ratio: number }> = {
  g: {kind:"mass",ratio:1}, gr:{kind:"mass",ratio:1}, gram:{kind:"mass",ratio:1},
  "г":{kind:"mass",ratio:1},"гр":{kind:"mass",ratio:1},
  kg:{kind:"mass",ratio:1000},"кг":{kind:"mass",ratio:1000},
  ml:{kind:"volume",ratio:1},"мл":{kind:"volume",ratio:1},
  l:{kind:"volume",ratio:1000},"л":{kind:"volume",ratio:1000},
  tsp:{kind:"volume",ratio:5},"цайны халбага":{kind:"volume",ratio:5},
  tbsp:{kind:"volume",ratio:15},"хоолны халбага":{kind:"volume",ratio:15},
  pcs:{kind:"count",ratio:1},piece:{kind:"count",ratio:1},pieces:{kind:"count",ratio:1},
  "ш":{kind:"count",ratio:1},"ширхэг":{kind:"count",ratio:1},
};
const norm = (s: string) => s.trim().toLowerCase().replace(/\.$/, "");
/** Returns available quantity expressed in the requested unit; null means no safe conversion. */
export function convertQuantity(value: number, from: string, to: string): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const a = norm(from), b = norm(to);
  if (a === b) return value;
  const au = UNITS[a], bu = UNITS[b];
  if (!au || !bu || au.kind !== bu.kind) return null;
  return value * au.ratio / bu.ratio;
}

export function aggregateMealShopping(recipes: ShoppingRecipe[], pantry: ShoppingStock[] = []): ShoppingLine[] {
  const grouped = new Map<string, ShoppingLine & { canonicalId: string }>();
  for (const recipe of recipes) {
    const factor = recipe.plannedServes / recipe.baseServes;
    if (!Number.isFinite(factor) || factor <= 0 || factor > 100) continue;
    for (const ing of recipe.ingredients) {
      const qty = ing.quantity * factor;
      if (!ing.name.trim() || !Number.isFinite(qty) || qty <= 0) continue;
      const canonicalId = ing.ingredient_canonical_id ?? "";
      const key = `${canonicalId || norm(ing.name)}|${norm(ing.unit)}`;
      const prior = grouped.get(key);
      if (prior) prior.quantity += qty;
      else grouped.set(key, {key, canonicalId, name: ing.name.trim(), unit: ing.unit.trim(),
        quantity: qty, stockUncertain: false});
    }
  }
  const stock = pantry.map(item => ({ ...item, quantityLeft: Number(item.quantity) }))
    .filter(item => Number.isFinite(item.quantityLeft) && item.quantityLeft > 0);
  const out: ShoppingLine[] = [];
  for (const line of grouped.values()) {
    let remaining = line.quantity;
    let stockUncertain = false;
    for (const pantryItem of stock) {
      const same = line.canonicalId
        ? pantryItem.canonical_id === line.canonicalId
        : norm(pantryItem.name) === norm(line.name);
      if (!same || pantryItem.quantityLeft <= 0) continue;
      const converted = convertQuantity(pantryItem.quantityLeft, pantryItem.unit, line.unit);
      if (converted === null) { stockUncertain = true; continue; }
      const used = Math.min(remaining, converted);
      remaining -= used;
      const usedPantry = convertQuantity(used, line.unit, pantryItem.unit);
      if (usedPantry !== null) pantryItem.quantityLeft = Math.max(0, pantryItem.quantityLeft - usedPantry);
      if (remaining < 0.000001) break;
    }
    if (remaining > 0.000001) out.push({key:line.key, name:line.name, unit:line.unit,
      quantity:Math.round(remaining * 1000)/1000, stockUncertain});
  }
  return out.sort((a,b) => a.name.localeCompare(b.name,"mn"));
}

export function mondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(),date.getMonth(),date.getDate());
  d.setDate(d.getDate() - ((d.getDay()+6)%7));
  return d;
}
