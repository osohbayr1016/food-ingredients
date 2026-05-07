import { Hono } from "hono";
import type { Env } from "../bindings";

function normNames(body: unknown) {
  const arr = body && typeof body === "object" && "ingredient_names" in body
    ? (body as { ingredient_names?: unknown }).ingredient_names
    : [];
  const list = Array.isArray(arr) ? arr.map(String) : [];
  const set = list.map((s) => s.toLowerCase().trim()).filter(Boolean);
  return [...new Set(set)];
}

function placeholders(n: number) {
  return n ? `(${Array.from({ length: n }, () => "?").join(",")})` : "(NULL)";
}

export const suggest = new Hono<{ Bindings: Env }>();

suggest.post("/suggest", async (c) => {
  const body = await c.req.json().catch(() => null);
  const names = normNames(body);
  if (!names.length) return c.json({ results: [] });

  const canonPh = placeholders(names.length);
  const canon = await c.env.DB.prepare(
    `SELECT DISTINCT id FROM (
       SELECT id FROM ingredient_canonicals WHERE lower(trim(name)) IN ${canonPh}
       UNION SELECT canonical_id AS id FROM ingredient_aliases WHERE normalized IN ${canonPh}
     )`,
  )
    .bind(...names, ...names)
    .all<{ id: string }>();

  const canonIds = [...new Set((canon.results ?? []).map((r) => String(r.id)))];
  const namePh = placeholders(names.length);
  const canonPhIn = placeholders(canonIds.length);

  let scoreSql =
    `SELECT r.id AS recipe_id, r.title AS title, sum(
        CASE WHEN `;

  scoreSql +=
    canonIds.length
      ? `(i.ingredient_canonical_id IN ${canonPhIn} OR lower(trim(i.name)) IN ${namePh})`
      : `lower(trim(i.name)) IN ${namePh}`;

  scoreSql +=
    ` THEN 1 ELSE 0 END) AS matched_rows, count(i.id) AS total_rows
     FROM recipes r JOIN ingredients i ON i.recipe_id = r.id
     WHERE r.is_published = 1 GROUP BY r.id`;

  const bindsScore: (string | number)[] = [];
  if (canonIds.length) bindsScore.push(...canonIds, ...names);
  else bindsScore.push(...names);

  const stmt = c.env.DB.prepare(scoreSql).bind(...bindsScore);
  type Row = {
    recipe_id: string;
    title: string;
    matched_rows: number;
    total_rows: number;
  };
  const agg = await stmt.all<Row>();
  const rows = (agg.results ?? []).map((row) => {
    const pct = row.total_rows
      ? row.matched_rows / row.total_rows
      : 0;
    return { ...row, pct };
  }).filter((r) => r.pct >= 0.5 || r.matched_rows > 0)
    .sort((a, b) => b.pct - a.pct || b.matched_rows - a.matched_rows).slice(0, 20);

  const nameSet = new Set(names);
  const canonSet = new Set(canonIds);
  type Ing = {
    recipe_id: string;
    ingredient_canonical_id: string | null;
    name: string;
  };
  const ingMap = new Map<string, Ing[]>();
  if (rows.length) {
    const idsPh = placeholders(rows.length);
    const list = rows.map((r) => r.recipe_id);
    const ir = await c.env.DB.prepare(
      `SELECT id, recipe_id, ingredient_canonical_id, name FROM ingredients WHERE recipe_id IN ${idsPh}`,
    )
      .bind(...list)
      .all<Ing>();
    for (const row of ir.results ?? []) {
      const k = row.recipe_id;
      ingMap.set(k, [...(ingMap.get(k) ?? []), row]);
    }
  }

  const out = rows.map(({ recipe_id: recipeId }) => {
    const ings = ingMap.get(recipeId) ?? [];
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];
    let matchedCnt = 0;
    const totalIngredients = ings.length;
    for (const ing of ings) {
      const canonMatch =
        !!(ing.ingredient_canonical_id &&
          canonSet.has(ing.ingredient_canonical_id));
      const nameHit = nameSet.has(ing.name.toLowerCase().trim());
      const hit = canonMatch || nameHit;
      if (hit) {
        matchedCnt += 1;
        matchedIngredients.push(ing.name);
      } else {
        missingIngredients.push(ing.name);
      }
    }
    const pct = totalIngredients ? matchedCnt / totalIngredients : 0;
    const titleRow = rows.find((r) => r.recipe_id === recipeId)!;
    return {
      recipe_id: recipeId,
      title: titleRow.title,
      match_ratio: pct,
      matched_count: matchedCnt,
      total_ingredients: totalIngredients,
      matched_ingredients: matchedIngredients,
      missing_ingredients: missingIngredients,
    };
  });

  return c.json({ results: out });
});
