import type { Env } from "../bindings";

const MAX_BYTES = 12 * 1024 * 1024;
const FETCH_MS = 25_000;

function trimEnv(v: string | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function extForContentType(ct: string): string {
  const c = ct.toLowerCase();
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  return "jpg";
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
  const contentType =
    rawCt?.split(";")[0]?.trim().toLowerCase() ?? "application/octet-stream";
  if (!contentType.startsWith("image/")) return null;

  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return null;

  const ext = extForContentType(contentType);
  const r2_key = `recipes/${recipeId}/${crypto.randomUUID()}.${ext}`;

  try {
    await env.BUCKET.put(r2_key, buf, {
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
