import type { RecipePatchPayload } from "./recipePayload";

function publishedVal(v?: number | boolean) {
  return v === true || v === 1 ? 1 : 0;
}

function childStatements(
  db: D1Database,
  recipeId: string,
  patch: RecipePatchPayload,
): D1PreparedStatement[] {
  const stmts: D1PreparedStatement[] = [];
  for (const tg of patch.tag_ids ?? []) {
    stmts.push(
      db.prepare(
        `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?,?)`,
      ).bind(recipeId, tg),
    );
  }
  patch.ingredients.forEach((ing, idx) => {
    const sid = ing.id?.trim() || crypto.randomUUID();
    stmts.push(
      db.prepare(
        `INSERT INTO ingredients (
          id, recipe_id, ingredient_canonical_id, name, quantity, unit, category_id, note, sort_order
        ) VALUES (?,?,?,?,?,?,?,?,?)`,
      ).bind(
        sid,
        recipeId,
        ing.ingredient_canonical_id ?? null,
        ing.name,
        ing.quantity,
        ing.unit,
        ing.category_id,
        ing.note ?? null,
        ing.sort_order ?? idx,
      ),
    );
  });
  patch.steps.forEach((step, idx) => {
    const sid = step.id?.trim() || crypto.randomUUID();
    stmts.push(
      db.prepare(
        `INSERT INTO steps (
          id, recipe_id, step_order, description, description_template, timer_seconds, tip
        ) VALUES (?,?,?,?,?,?,?)`,
      ).bind(
        sid,
        recipeId,
        idx + 1,
        step.description,
        step.description_template ?? null,
        step.timer_seconds ?? null,
        step.tip ?? null,
      ),
    );
  });
  return stmts;
}

export async function insertRecipe(db: D1Database, recipeId: string, patch: RecipePatchPayload) {
  const stmts = [
    db.prepare(
      `INSERT INTO recipes (
        id, title, cuisine, prep_time, cook_time, difficulty, image_r2_key, description, tips, serves, is_published
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      recipeId,
      patch.recipe.title,
      patch.recipe.cuisine,
      patch.recipe.prep_time,
      patch.recipe.cook_time,
      patch.recipe.difficulty,
      patch.recipe.image_r2_key ?? null,
      patch.recipe.description,
      patch.recipe.tips ?? null,
      patch.recipe.serves,
      publishedVal(patch.recipe.is_published),
    ),
    ...childStatements(db, recipeId, patch),
  ];
  await db.batch(stmts);
}

export async function applyRecipePatch(
  db: D1Database,
  recipeId: string,
  patch: RecipePatchPayload,
) {
  const stmts: D1PreparedStatement[] = [];

  stmts.push(
    db.prepare(
      `UPDATE recipes SET title=?, cuisine=?, prep_time=?, cook_time=?, difficulty=?,
           image_r2_key=?, description=?, tips=?, serves=?, is_published=?
           WHERE id=?`,
    ).bind(
      patch.recipe.title,
      patch.recipe.cuisine,
      patch.recipe.prep_time,
      patch.recipe.cook_time,
      patch.recipe.difficulty,
      patch.recipe.image_r2_key ?? null,
      patch.recipe.description,
      patch.recipe.tips ?? null,
      patch.recipe.serves,
      publishedVal(patch.recipe.is_published),
      recipeId,
    ),
  );

  stmts.push(db.prepare(`DELETE FROM recipe_tags WHERE recipe_id = ?`).bind(recipeId));
  stmts.push(db.prepare(`DELETE FROM ingredients WHERE recipe_id = ?`).bind(recipeId));
  stmts.push(db.prepare(`DELETE FROM steps WHERE recipe_id = ?`).bind(recipeId));
  stmts.push(...childStatements(db, recipeId, patch));

  await db.batch(stmts);
}
