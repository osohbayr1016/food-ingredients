export type SuggestIngRow = {
  recipe_id: string;
  ingredient_canonical_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  note: string | null;
  category_name: string;
  sort_order: number;
};

export type IngredientPreviewOut = {
  name: string;
  quantity: number;
  unit: string;
  category_name: string;
  note: string | null;
  matched: boolean;
};

export function buildIngredientPreview(
  ings: SuggestIngRow[],
  nameSet: Set<string>,
  canonSet: Set<string>,
): { matchedCount: number; preview: IngredientPreviewOut[] } {
  let matchedCount = 0;
  const preview: IngredientPreviewOut[] = [];
  for (const ing of ings) {
    const canonMatch =
      !!(ing.ingredient_canonical_id &&
        canonSet.has(ing.ingredient_canonical_id));
    const nameHit = nameSet.has(ing.name.toLowerCase().trim());
    const hit = canonMatch || nameHit;
    if (hit) matchedCount += 1;
    preview.push({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      category_name: ing.category_name,
      note: ing.note,
      matched: hit,
    });
  }
  return { matchedCount, preview };
}
