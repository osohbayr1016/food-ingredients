import { clientFetch } from "@/lib/clientApi";
import type { RecipeListItem } from "@/lib/types";

const BATCH = 8;

function rowToListItem(r: Record<string, unknown>): RecipeListItem | null {
  const id = String(r.id ?? "");
  if (!id) return null;
  return {
    id,
    title: String(r.title ?? ""),
    cuisine: String(r.cuisine ?? ""),
    prep_time: Number(r.prep_time ?? 0),
    cook_time: Number(r.cook_time ?? 0),
    difficulty: Number(r.difficulty ?? 2),
    image_r2_key:
      r.image_r2_key == null ? null : String(r.image_r2_key),
    gallery_r2_keys:
      r.gallery_r2_keys == null ? null : String(r.gallery_r2_keys),
    description: String(r.description ?? ""),
    tips: r.tips == null ? null : String(r.tips),
    serves: Number(r.serves ?? 4),
    is_published: Number(r.is_published ?? 0),
    created_at: String(r.created_at ?? ""),
  };
}

/** Fetch published recipe cards for local liked ids; reports ids to drop (404). */
export async function fetchGuestLikedRecipes(ids: string[]): Promise<{
  recipes: RecipeListItem[];
  missingIds: string[];
}> {
  const recipes: RecipeListItem[] = [];
  const missingIds: string[] = [];
  const uniq = [...new Set(ids)];

  for (let i = 0; i < uniq.length; i += BATCH) {
    const chunk = uniq.slice(i, i + BATCH);
    const results = await Promise.all(
      chunk.map(async (id) => {
        const res = await clientFetch(`/recipes/${id}`);
        if (!res.ok) return { id, item: null as RecipeListItem | null };
        const j = (await res.json()) as { recipe?: Record<string, unknown> };
        const item = j.recipe ? rowToListItem(j.recipe) : null;
        return { id, item };
      }),
    );
    for (const { id, item } of results) {
      if (item) recipes.push(item);
      else missingIds.push(id);
    }
  }
  return { recipes, missingIds };
}
