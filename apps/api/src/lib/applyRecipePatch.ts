import type { RecipePatchPayload } from "./recipePayload";
import { enrichPatchIngredientCanonicals } from "./ingredientCanonicalResolve";
import { metadataUpsert, recipeEvidenceUpsert } from "./recipeMetadata";

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
  const enriched = await enrichPatchIngredientCanonicals(db, patch);
  const stmts = [
    db.prepare(
      `INSERT INTO recipes (
        id, title, cuisine, prep_time, cook_time, difficulty, image_r2_key, gallery_r2_keys, description, tips, serves, is_published, import_source, import_external_id
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      recipeId,
      enriched.recipe.title,
      enriched.recipe.cuisine,
      enriched.recipe.prep_time,
      enriched.recipe.cook_time,
      enriched.recipe.difficulty,
      enriched.recipe.image_r2_key ?? null,
      enriched.recipe.gallery_r2_keys ?? null,
      enriched.recipe.description,
      enriched.recipe.tips ?? null,
      enriched.recipe.serves,
      publishedVal(enriched.recipe.is_published),
      enriched.recipe.import_source ?? null,
      enriched.recipe.import_external_id ?? null,
    ),
    ...childStatements(db, recipeId, enriched),
    ...(enriched.metadata ? [
      metadataUpsert(db,recipeId,enriched.metadata),
      recipeEvidenceUpsert(db,recipeId,enriched.metadata),
    ] : []),
  ];
  await db.batch(stmts);
}

export async function applyRecipePatch(
  db: D1Database,
  recipeId: string,
  patch: RecipePatchPayload,
) {
  const enriched = await enrichPatchIngredientCanonicals(db, patch);
  const stmts: D1PreparedStatement[] = [];

  const src =
    enriched.recipe.import_source !== undefined
      ? enriched.recipe.import_source
      : null;
  const ext =
    enriched.recipe.import_external_id !== undefined
      ? enriched.recipe.import_external_id
      : null;

  stmts.push(
    db.prepare(
      `UPDATE recipes SET title=?, cuisine=?, prep_time=?, cook_time=?, difficulty=?,
           image_r2_key=?, gallery_r2_keys=?, description=?, tips=?, serves=?, is_published=?,
           import_source=COALESCE(?, import_source), import_external_id=COALESCE(?, import_external_id)
           WHERE id=?`,
    ).bind(
      enriched.recipe.title,
      enriched.recipe.cuisine,
      enriched.recipe.prep_time,
      enriched.recipe.cook_time,
      enriched.recipe.difficulty,
      enriched.recipe.image_r2_key ?? null,
      enriched.recipe.gallery_r2_keys ?? null,
      enriched.recipe.description,
      enriched.recipe.tips ?? null,
      enriched.recipe.serves,
      publishedVal(enriched.recipe.is_published),
      src,
      ext,
      recipeId,
    ),
  );

  stmts.push(db.prepare(`DELETE FROM recipe_tags WHERE recipe_id = ?`).bind(recipeId));
  stmts.push(db.prepare(`DELETE FROM ingredients WHERE recipe_id = ?`).bind(recipeId));
  stmts.push(db.prepare(`DELETE FROM steps WHERE recipe_id = ?`).bind(recipeId));
  stmts.push(...childStatements(db, recipeId, enriched));
  if (enriched.metadata) {
    stmts.push(metadataUpsert(db,recipeId,enriched.metadata));
    stmts.push(recipeEvidenceUpsert(db,recipeId,enriched.metadata));
  }
  // Edits invalidate an earlier approval-to-publish queue entry.
  // The reviewer must explicitly queue the updated version again.
  stmts.push(db.prepare(
    "DELETE FROM recipe_publication_queue WHERE recipe_id=? AND status='queued'"
  ).bind(recipeId));
  // A changed recipe must never inherit prior editorial approval or remain public.
  // This is server-enforced even if a stale admin form submits "approved".
  stmts.push(db.prepare(`UPDATE recipe_metadata SET review_status='pending',
      allergen_status='unknown', reviewed_at=NULL, updated_at=datetime('now')
      WHERE recipe_id=?`).bind(recipeId));
  stmts.push(db.prepare(`UPDATE recipes SET is_published=0 WHERE id=?`).bind(recipeId));

  await db.batch(stmts);
}
