import { apiBase } from "./publicEnv";

function normalizeImageContentType(blob: Blob): string {
  const t = blob.type;
  if (t === "image/webp" || t === "image/jpeg" || t === "image/png") return t;
  return "image/jpeg";
}

/** Uploads via API Worker → R2 binding (no browser PUT to presigned S3 URL). */
export async function presignAndPutRecipeImage(
  token: string,
  recipeId: string,
  blob: Blob,
): Promise<string> {
  const ct = normalizeImageContentType(blob);
  const res = await fetch(`${apiBase()}/admin/upload/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": ct,
      "X-Recipe-Id": recipeId,
    },
    body: blob,
  });
  const data = (await res.json().catch(() => ({}))) as {
    r2_key?: string;
    error?: string;
    message?: string;
  };
  if (!res.ok)
    throw new Error(data.message || data.error || `upload_${res.status}`);
  if (!data.r2_key) throw new Error("upload_bad");
  return data.r2_key;
}
