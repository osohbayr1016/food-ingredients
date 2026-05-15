import { apiBase } from "./publicEnv";
import { adminHeaders } from "./adminRecipeFetch";
import type { RecipePatchPayload } from "./adminRecipeTypes";

export type MealSearchRow = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};

export async function theMealDbAdminSearch(token: string, q: string) {
  const url = new URL(`${apiBase()}/admin/import/themealdb/search`);
  url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { headers: adminHeaders(token) });
  const j = (await res.json().catch(() => ({}))) as {
    meals?: MealSearchRow[];
    error?: string;
  };
  return { ok: res.ok, meals: j.meals ?? [], error: j.error };
}

export type TheMealDbDedupe = {
  conflict: "external" | null;
  existing_recipe_id: string | null;
  title_matches: { id: string; title: string }[];
  dedupe_unavailable?: boolean;
};

export async function theMealDbAdminPreview(token: string, idMeal: string) {
  const url = new URL(`${apiBase()}/admin/import/themealdb/preview`);
  url.searchParams.set("id", idMeal);
  const res = await fetch(url.toString(), { headers: adminHeaders(token) });
  const j = (await res.json().catch(() => ({}))) as {
    patch?: RecipePatchPayload;
    dedupe?: TheMealDbDedupe;
    error?: string;
  };
  return {
    ok: res.ok,
    patch: j.patch ?? null,
    dedupe: j.dedupe ?? null,
    error: j.error,
  };
}

export async function theMealDbAdminCommit(
  token: string,
  body: { idMeal: string; publish: boolean; skip_image: boolean },
) {
  const res = await fetch(`${apiBase()}/admin/import/themealdb/commit`, {
    method: "POST",
    headers: adminHeaders(token),
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: string;
    recipe_id?: string;
  };
  return {
    ok: res.ok,
    status: res.status,
    id: j.id,
    error: j.error,
    recipe_id: j.recipe_id,
  };
}
