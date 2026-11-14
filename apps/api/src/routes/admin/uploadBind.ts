import { Hono } from "hono";
import type { Env } from "../../bindings";
import { safeRecipeUploadScope } from "../../lib/uploadKeyScope";
import { imageMagicMatches, readBoundedImageBody, supportedImageMime,
  MAX_RECIPE_IMAGE_BYTES } from "../../lib/imageBodyValidation";

function trimEnv(v: string | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function extForCt(ct: string): string {
  if (ct.endsWith("webp")) return "webp";
  if (ct.endsWith("png")) return "png";
  return "jpg";
}

export const uploadBind = new Hono<{ Bindings: Env }>();

/** Writes image bytes to R2 using the Worker R2 binding (no S3 API keys). */
uploadBind.post("/upload/image", async (c) => {
  const pub = trimEnv(c.env.R2_PUBLIC_BASE_URL);
  if (!pub || /^https?:\/\/pub-example\./i.test(pub))
    return c.json(
      {
        error: "r2_public_url_missing",
        message:
          "Set R2_PUBLIC_BASE_URL to your bucket’s public r2.dev URL (wrangler [vars]).",
      },
      501,
    );

  const contentType = supportedImageMime(c.req.header("Content-Type"));
  if (!contentType) return c.json({ error: "unsupported_type" }, 400);

  const recipePart = safeRecipeUploadScope(c.req.header("X-Recipe-Id"));
  if (!recipePart) return c.json({ error: "bad_recipe_id" }, 400);

  const lengthHeader = c.req.header("Content-Length");
  if (lengthHeader && /^\d+$/.test(lengthHeader) && Number(lengthHeader) > MAX_RECIPE_IMAGE_BYTES)
    return c.json({ error: "too_large", max_bytes: MAX_RECIPE_IMAGE_BYTES }, 413);
  const body = await readBoundedImageBody(c.req.raw.body);
  if (!body.ok) return body.error === "too_large"
    ? c.json({ error: body.error, max_bytes: MAX_RECIPE_IMAGE_BYTES }, 413)
    : c.json({ error: body.error }, 400);
  if (!imageMagicMatches(body.bytes, contentType))
    return c.json({ error: "invalid_image_signature" }, 415);

  const r2_key = `recipes/${recipePart}/${crypto.randomUUID()}.${extForCt(
    contentType,
  )}`;

  try {
    await c.env.BUCKET.put(r2_key, body.bytes, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return c.json({ error: "r2_put_failed", message: msg }, 502);
  }

  return c.json({
    r2_key,
    public_url: `${pub.replace(/\/$/, "")}/${r2_key}`,
  });
});
