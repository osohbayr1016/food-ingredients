import type { RecipePatchPayload } from "./recipePayload";
import { validateRecipeMetadata } from "./recipeMetadata";

/** Fail closed on invalid publication metadata; drafts may be incomplete. */
export function validateRecipePatch(value: unknown): string[] {
  if (!value || typeof value !== "object") return ["invalid_payload"];
  const p = value as Partial<RecipePatchPayload>;
  if (!p.recipe || typeof p.recipe !== "object" || !Array.isArray(p.ingredients) || !Array.isArray(p.steps)) return ["invalid_payload"];
  const r = p.recipe;
  const errors: string[] = [...validateRecipeMetadata(p.metadata)];
  const str = (v: unknown) => typeof v === "string" ? v.trim() : "";
  const int = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
  if (str(r.title).length < 3 || str(r.title).length > 160) errors.push("invalid_title");
  if (!str(r.cuisine) || str(r.cuisine).length > 80) errors.push("invalid_cuisine");
  if (typeof r.description !== "string" || r.description.length > 6000) errors.push("invalid_description");
  if (r.tips != null && (typeof r.tips !== "string" || r.tips.length > 10000)) errors.push("invalid_tips");
  if (!int(r.prep_time, 0, 1440) || !int(r.cook_time, 0, 1440)) errors.push("invalid_time");
  if (!int(r.serves, 1, 100)) errors.push("invalid_serves");
  if (!int(r.difficulty, 1, 3)) errors.push("invalid_difficulty");
  if (p.ingredients.length > 100) errors.push("too_many_ingredients");
  if (p.steps.length > 80) errors.push("too_many_steps");
  if (p.tag_ids && (!Array.isArray(p.tag_ids) || p.tag_ids.length > 40 || p.tag_ids.some(id => typeof id !== "string" || id.length > 100))) errors.push("invalid_tags");
  for (const [i, ing] of p.ingredients.entries()) {
    if (!ing || typeof ing !== "object" || !str(ing.name) || str(ing.name).length > 150 ||
        !Number.isFinite(ing.quantity) || ing.quantity <= 0 || ing.quantity > 100000 ||
        typeof ing.unit !== "string" || ing.unit.length > 45 ||
        !str(ing.category_id) || str(ing.category_id).length > 100) {
      errors.push(`invalid_ingredient_${i + 1}`);
    }
  }
  for (const [i, step] of p.steps.entries()) {
    if (!step || typeof step !== "object" || str(step.description).length < 4 || str(step.description).length > 4000 ||
        (step.timer_seconds != null && !int(step.timer_seconds, 0, 86400))) {
      errors.push(`invalid_step_${i + 1}`);
    }
  }
  if (r.is_published === true || r.is_published === 1) {
    if (p.metadata?.review_status !== "approved") errors.push("publish_requires_editorial_approval");
    if (!p.metadata?.license_name?.trim()) errors.push("publish_requires_content_rights");
    if (p.ingredients.length < 2) errors.push("publish_requires_ingredients");
    if (p.steps.length < 2) errors.push("publish_requires_steps");
    if (!Number.isFinite(r.prep_time + r.cook_time) || r.prep_time + r.cook_time <= 0) errors.push("publish_requires_known_time");
    if (str(r.description).length < 15) errors.push("publish_requires_description");
  }
  return errors;
}
