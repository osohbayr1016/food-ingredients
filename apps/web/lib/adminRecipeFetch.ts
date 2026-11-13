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
  review_status?: "pending" | "approved" | null;
  license_name?: string | null;
  queue_status?: "queued" | "published" | null;
};

export type AdminRecipeStatus = "all" | "draft" | "published" | "pending" | "ready";

export async function fetchAdminRecipes(token: string, page = 1, status: AdminRecipeStatus = "all") {
  const search = new URLSearchParams({page:String(page),status});
  const res = await fetch(`${apiBase()}/admin/recipes?${search}`, { headers: adminHeaders(token) });
  const j = (await res.json().catch(() => ({}))) as {
    recipes?: AdminRecipeListRow[];
    pagination?: {page:number;has_more:boolean};
  };
  return {
    ok: res.ok && Array.isArray(j.recipes),
    recipes: Array.isArray(j.recipes) ? j.recipes : [],
    hasMore: j.pagination?.has_more === true,
  };
}

export async function approveAdminRecipe(token: string, recipeId: string) {
  return fetch(`${apiBase()}/admin/recipes/${encodeURIComponent(recipeId)}/approve`, {
    method: "POST", headers: adminHeaders(token),
  });
}
export async function publishAdminRecipe(token: string, recipeId: string) {
  return fetch(`${apiBase()}/admin/recipes/${encodeURIComponent(recipeId)}/publish`, {
    method: "POST", headers: adminHeaders(token),
  });
}
export type RecipeAutomationStatus = {
  import_enabled:boolean; publish_enabled:boolean;
  queued_count:number; last_published_at:string|null;
};
export async function fetchRecipeAutomationStatus(token: string): Promise<RecipeAutomationStatus> {
  const res=await fetch(`${apiBase()}/admin/automation/status`,{headers:adminHeaders(token)});
  if(!res.ok) throw new Error("automation_status_unavailable");
  return await res.json() as RecipeAutomationStatus;
}

export async function queueAdminRecipe(token: string, recipeId: string) {
  return fetch(`${apiBase()}/admin/recipes/${encodeURIComponent(recipeId)}/queue`, {
    method: "POST", headers: adminHeaders(token),
  });
}

export async function cancelQueuedRecipe(token: string, recipeId: string) {
  return fetch(`${apiBase()}/admin/recipes/${encodeURIComponent(recipeId)}/queue`, {
    method: "DELETE", headers: adminHeaders(token),
  });
}

export type AdminRecipeDetail = {
  metadata?: Record<string, unknown>;
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
