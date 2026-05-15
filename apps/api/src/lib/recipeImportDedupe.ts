export async function findRecipeByImport(
  db: D1Database,
  importSource: string,
  importExternalId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT id FROM recipes WHERE import_source = ? AND import_external_id = ?`,
    )
    .bind(importSource, importExternalId)
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function findRecipesByNormalizedTitle(
  db: D1Database,
  title: string,
): Promise<{ id: string; title: string }[]> {
  const norm = title.trim().toLowerCase();
  if (!norm) return [];
  const { results } = await db
    .prepare(`SELECT id, title FROM recipes WHERE lower(trim(title)) = ?`)
    .bind(norm)
    .all<{ id: string; title: string }>();
  return results ?? [];
}
