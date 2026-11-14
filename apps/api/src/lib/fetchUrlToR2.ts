import type { Env } from "../bindings";
import { imageMagicMatches, readBoundedImageBody, supportedImageMime,
  MAX_RECIPE_IMAGE_BYTES } from "./imageBodyValidation";

const FETCH_MS = 25_000;

function trimEnv(v: string | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Download a remote image into R2 (same guard as uploadBind: needs real R2_PUBLIC_BASE_URL).
 * Returns r2_key or null on any failure.
 */
export async function fetchRemoteImageToR2(
  env: Env,
  recipeId: string,
  imageUrl: string,
): Promise<string | null> {
  const pub = trimEnv(env.R2_PUBLIC_BASE_URL);
  if (!pub || /^https?:\/\/pub-example\./i.test(pub)) return null;

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_MS);
  let res: Response;
  try {
    res = await fetch(imageUrl, { signal: ac.signal });
  } catch {
    clearTimeout(timer);
    return null;
  }
  clearTimeout(timer);
  if (!res.ok) return null;

  const rawCt = res.headers.get("content-type");
  const contentType = supportedImageMime(rawCt);
  if (!contentType) return null;
  const contentLength = res.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_RECIPE_IMAGE_BYTES) return null;
  const image = await readBoundedImageBody(res.body);
  if (!image.ok || !imageMagicMatches(image.bytes, contentType)) return null;

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const r2_key = `recipes/${recipeId}/${crypto.randomUUID()}.${ext}`;

  try {
    await env.BUCKET.put(r2_key, image.bytes, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return null;
  }

  return r2_key;
}
