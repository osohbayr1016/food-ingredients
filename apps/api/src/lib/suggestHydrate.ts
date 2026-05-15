import type { PantryLineIn } from "./pantryQuantity";
import { sqlPlaceholders } from "./suggestBodyParse";

export async function hydratePantryLines(
  db: D1Database,
  pantry: PantryLineIn[],
): Promise<PantryLineIn[]> {
  const need = pantry.filter((p) => !p.name.trim() && p.canonical_id);
  if (!need.length) return pantry;
  const needIds = [...new Set(need.map((p) => p.canonical_id!))];
  const ph = sqlPlaceholders(needIds.length);
  const r = await db
    .prepare(
      `SELECT id, name FROM ingredient_canonicals WHERE id IN ${ph}`,
    )
    .bind(...needIds)
    .all<{ id: string; name: string }>();
  const look = new Map((r.results ?? []).map((x) => [x.id, x.name]));
  return pantry.map((p) => {
    if (p.name.trim()) return p;
    const nm = p.canonical_id ? look.get(p.canonical_id) : undefined;
    return nm ? { ...p, name: nm } : p;
  });
}
