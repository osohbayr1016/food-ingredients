import { apiBase } from "./publicEnv";
import type { RecipePatchPayload } from "./adminRecipeTypes";
import { presignAndPutRecipeImage } from "./adminImageUpload";
import { adminHeaders } from "./adminRecipeFetch";

export async function postAdminRecipe(token: string, payload: RecipePatchPayload) {
  return fetch(`${apiBase()}/admin/recipes`, {
    method: "POST",
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function patchAdminRecipe(
  token: string,
  id: string,
  payload: RecipePatchPayload,
) {
  return fetch(`${apiBase()}/admin/recipes/${id}`, {
    method: "PATCH",
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createRecipeWithOptionalImages(
  token: string,
  payload: RecipePatchPayload,
  imageBlobs: (Blob | null)[],
): Promise<{ id: string; imageWarning?: "upload_failed" | "patch_failed" }> {
  const res = await postAdminRecipe(token, payload);
  const j = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok) throw new Error(j.error ? String(j.error) : `create_${res.status}`);
  const id = j.id;
  if (!id) throw new Error("no_id");

  const hasAnyBlob = imageBlobs.some((b) => b != null);
  if (!hasAnyBlob) return { id };

  const r2Keys: (string | null)[] = new Array(imageBlobs.length).fill(null);
  try {
    for (let i = 0; i < imageBlobs.length; i++) {
      const b = imageBlobs[i];
      if (!b) continue;
      r2Keys[i] = await presignAndPutRecipeImage(token, id, b);
    }
  } catch {
    return { id, imageWarning: "upload_failed" };
  }

  const hero = r2Keys[0] ?? null;
  const galleryArr = r2Keys.slice(1).filter((k): k is string => k != null);
  const galleryJson = galleryArr.length ? JSON.stringify(galleryArr) : null;
  const patched: RecipePatchPayload = {
    ...payload,
    recipe: {
      ...payload.recipe,
      image_r2_key: hero,
      gallery_r2_keys: galleryJson,
    },
  };
  const patchRes = await patchAdminRecipe(token, id, patched);
  if (!patchRes.ok) return { id, imageWarning: "patch_failed" };
  return { id };
}
