import { Hono } from "hono";
import type { Env } from "../../bindings";

const MAX_BYTES = 12 * 1024 * 1024;

function trimEnv(v: string | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeCt(h: string | undefined | null): string | null {
  const ct = (h || "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (ct === "image/webp" || ct === "image/jpeg" || ct === "image/png") return ct;
  return null;
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

  const contentType = normalizeCt(c.req.header("Content-Type"));
  if (!contentType) return c.json({ error: "unsupported_type" }, 400);

  const recipePart = c.req.header("X-Recipe-Id")?.trim() || "draft";
  if (recipePart.length > 200) return c.json({ error: "bad_recipe_id" }, 400);

  const buf = await c.req.arrayBuffer();
  if (buf.byteLength === 0) return c.json({ error: "empty_body" }, 400);
  if (buf.byteLength > MAX_BYTES)
    return c.json({ error: "too_large", max_bytes: MAX_BYTES }, 413);

  const r2_key = `recipes/${recipePart}/${crypto.randomUUID()}.${extForCt(
    contentType,
  )}`;

  try {
    await c.env.BUCKET.put(r2_key, buf, {
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
