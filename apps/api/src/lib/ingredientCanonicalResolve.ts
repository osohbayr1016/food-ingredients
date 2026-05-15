import type { RecipePatchPayload } from "./recipePayload";
import { sqlPlaceholders } from "./suggestBodyParse";

async function mapNormsToCanonicalIds(
  db: D1Database,
  norms: string[],
): Promise<Map<string, string>> {
  const uniq = [...new Set(norms.filter(Boolean))];
  const out = new Map<string, string>();
  if (!uniq.length) return out;

  const ph = sqlPlaceholders(uniq.length);
  const al = await db
    .prepare(
      `SELECT normalized, canonical_id FROM ingredient_aliases WHERE normalized IN ${ph}`,
    )
    .bind(...uniq)
    .all<{ normalized: string; canonical_id: string }>();
  for (const r of al.results ?? []) {
    out.set(r.normalized.trim().toLowerCase(), r.canonical_id);
  }

  const missing = uniq.filter((n) => !out.has(n));
  if (!missing.length) return out;

  const ph2 = sqlPlaceholders(missing.length);
  const cn = await db
    .prepare(
      `SELECT id, name FROM ingredient_canonicals WHERE lower(trim(name)) IN ${ph2}`,
    )
    .bind(...missing)
    .all<{ id: string; name: string }>();
  for (const r of cn.results ?? []) {
    const k = r.name.trim().toLowerCase();
    if (!out.has(k)) out.set(k, r.id);
  }
  return out;
}

export async function enrichPatchIngredientCanonicals(
  db: D1Database,
  patch: RecipePatchPayload,
): Promise<RecipePatchPayload> {
  const norms: string[] = [];
  for (const ing of patch.ingredients) {
    if (ing.ingredient_canonical_id?.trim()) continue;
    const n = ing.name.trim().toLowerCase();
    if (n) norms.push(n);
  }
  if (!norms.length) return patch;

  const map = await mapNormsToCanonicalIds(db, norms);
  if (!map.size) return patch;

  return {
    ...patch,
    ingredients: patch.ingredients.map((ing) => {
      if (ing.ingredient_canonical_id?.trim()) return ing;
      const id = map.get(ing.name.trim().toLowerCase());
      if (!id) return ing;
      return { ...ing, ingredient_canonical_id: id };
    }),
  };
}
