import { apiBase } from "./publicEnv";
import { getDeviceId } from "./clientApi";

export function adminHeaders(token: string) {
  const h = new Headers();
  h.set("Content-Type", "application/json");
  h.set("Authorization", `Bearer ${token.trim()}`);
  const did = getDeviceId();
  if (did) h.set("X-Device-Id", did);
  return h;
}

export type AdminRecipeListRow = {
  id: string;
  title: string;
  cuisine: string;
  is_published: number;
  created_at: string;
};

export async function fetchAdminRecipes(token: string) {
  const res = await fetch(`${apiBase()}/admin/recipes`, { headers: adminHeaders(token) });
  const j = (await res.json().catch(() => ({}))) as { recipes?: AdminRecipeListRow[] };
  return {
    ok: res.ok,
    recipes: j.recipes ?? [],
  };
}

export type AdminRecipeDetail = {
  recipe: Record<string, unknown>;
  ingredients: Record<string, unknown>[];
  steps: Record<string, unknown>[];
  tag_ids: string[];
};

export async function fetchAdminRecipe(token: string, id: string) {
  const res = await fetch(`${apiBase()}/admin/recipes/${id}`, {
    headers: adminHeaders(token),
  });
  const j = (await res.json().catch(() => ({}))) as AdminRecipeDetail & { error?: string };
  return { ok: res.ok, data: j };
}

export async function deleteAdminRecipe(token: string, id: string) {
  return fetch(`${apiBase()}/admin/recipes/${id}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
}

export type IngredientCategoryRow = { id: string; name: string };

export async function fetchIngredientCategories(token: string) {
  const res = await fetch(`${apiBase()}/admin/ingredient-categories`, {
    headers: adminHeaders(token),
  });
  const j = (await res.json().catch(() => ({}))) as {
    categories?: IngredientCategoryRow[];
  };
  return { ok: res.ok, categories: j.categories ?? [] };
}

export type TagRow = { id: string; name: string };

export async function fetchAdminTags(token: string) {
  const res = await fetch(`${apiBase()}/admin/tags`, { headers: adminHeaders(token) });
  const j = (await res.json().catch(() => ({}))) as { tags?: TagRow[] };
  return { ok: res.ok, tags: j.tags ?? [] };
}
