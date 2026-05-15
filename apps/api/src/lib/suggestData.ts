import type { SuggestIngRow } from "./suggestIngredientPreview";
import type { SuggestFilters } from "./suggestBodyParse";
import { sqlPlaceholders } from "./suggestBodyParse";

export type ScoreRow = {
  recipe_id: string;
  title: string;
  matched_rows: number;
  total_rows: number;
};

export type SuggestMeta = {
  id: string;
  title: string;
  cuisine: string;
  prep_time: number;
  cook_time: number;
  difficulty: number;
  serves: number;
  image_r2_key: string | null;
  description: string;
};

export async function resolveCanonicalIds(
  db: D1Database,
  names: string[],
): Promise<string[]> {
  if (!names.length) return [];
  const canonPh = sqlPlaceholders(names.length);
  const canon = await db
    .prepare(
      `SELECT DISTINCT id FROM (
       SELECT id FROM ingredient_canonicals WHERE lower(trim(name)) IN ${canonPh}
       UNION SELECT canonical_id AS id FROM ingredient_aliases WHERE normalized IN ${canonPh}
     )`,
    )
    .bind(...names, ...names)
    .all<{ id: string }>();
  return [...new Set((canon.results ?? []).map((r) => String(r.id)))];
}

function recipeFilterWhere(filters: SuggestFilters): {
  sql: string;
  binds: (string | number)[];
} {
  const whereParts = ["r.is_published = 1"];
  const whereBinds: (string | number)[] = [];
  if (filters.max_total_minutes != null) {
    whereParts.push("(r.prep_time + r.cook_time) <= ?");
    whereBinds.push(filters.max_total_minutes);
  }
  if (filters.max_difficulty != null) {
    whereParts.push("r.difficulty <= ?");
    whereBinds.push(filters.max_difficulty);
  }
  if (filters.min_serves != null) {
    whereParts.push("r.serves >= ?");
    whereBinds.push(filters.min_serves);
  }
  if (filters.max_serves != null) {
    whereParts.push("r.serves <= ?");
    whereBinds.push(filters.max_serves);
  }
  return { sql: whereParts.join(" AND "), binds: whereBinds };
}

export async function scoreMatchingRecipes(
  db: D1Database,
  names: string[],
  canonIds: string[],
  filters: SuggestFilters,
): Promise<ScoreRow[]> {
  if (!canonIds.length && !names.length) return [];

  const namePh = sqlPlaceholders(names.length);
  const canonPhIn = sqlPlaceholders(canonIds.length);
  let matchCond: string;
  if (canonIds.length && names.length) {
    matchCond = `(i.ingredient_canonical_id IN ${canonPhIn} OR lower(trim(i.name)) IN ${namePh})`;
  } else if (canonIds.length) {
    matchCond = `(i.ingredient_canonical_id IN ${canonPhIn})`;
  } else {
    matchCond = `(lower(trim(i.name)) IN ${namePh})`;
  }

  const { sql: whereSql, binds: whereBinds } = recipeFilterWhere(filters);
  const scoreSql =
    `SELECT r.id AS recipe_id, r.title AS title, sum(
        CASE WHEN ` +
    matchCond +
    ` THEN 1 ELSE 0 END) AS matched_rows, count(i.id) AS total_rows
     FROM recipes r JOIN ingredients i ON i.recipe_id = r.id
     WHERE ${whereSql} GROUP BY r.id`;

  const bindsScore: (string | number)[] = [...whereBinds];
  if (canonIds.length) bindsScore.push(...canonIds);
  if (names.length) bindsScore.push(...names);

  const agg = await db.prepare(scoreSql).bind(...bindsScore).all<ScoreRow>();
  const scored = (agg.results ?? [])
    .map((row) => {
      const pct = row.total_rows ? row.matched_rows / row.total_rows : 0;
      return { ...row, pct };
    })
    .filter((r) => r.pct >= 0.5 || r.matched_rows > 0)
    .sort((a, b) => b.pct - a.pct || b.matched_rows - a.matched_rows)
    .slice(0, 20);
  return scored.map(({ pct: _p, ...row }) => row);
}

export async function loadIngredientsByRecipe(
  db: D1Database,
  recipeIds: string[],
): Promise<Map<string, SuggestIngRow[]>> {
  const ingMap = new Map<string, SuggestIngRow[]>();
  if (!recipeIds.length) return ingMap;
  const idsPh = sqlPlaceholders(recipeIds.length);
  const ir = await db
    .prepare(
      `SELECT i.recipe_id, i.ingredient_canonical_id, i.name, i.quantity, i.unit, i.note, i.sort_order,
              c.name AS category_name
       FROM ingredients i
       JOIN ingredient_categories c ON c.id = i.category_id
       WHERE i.recipe_id IN ${idsPh}
       ORDER BY i.recipe_id ASC, i.sort_order ASC`,
    )
    .bind(...recipeIds)
    .all<SuggestIngRow>();
  for (const row of ir.results ?? []) {
    const k = row.recipe_id;
    ingMap.set(k, [...(ingMap.get(k) ?? []), row]);
  }
  return ingMap;
}

export async function loadRecipeMetaById(
  db: D1Database,
  recipeIds: string[],
): Promise<Map<string, SuggestMeta>> {
  const metaMap = new Map<string, SuggestMeta>();
  if (!recipeIds.length) return metaMap;
  const idsPh = sqlPlaceholders(recipeIds.length);
  const metaRows = await db
    .prepare(
      `SELECT id, title, cuisine, prep_time, cook_time, difficulty, serves, image_r2_key, description
       FROM recipes WHERE id IN ${idsPh}`,
    )
    .bind(...recipeIds)
    .all<SuggestMeta>();
  for (const m of metaRows.results ?? []) {
    metaMap.set(String(m.id), m);
  }
  return metaMap;
}
