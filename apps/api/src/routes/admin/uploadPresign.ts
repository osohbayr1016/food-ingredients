import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Hono } from "hono";
import type { Env } from "../../bindings";

export const uploadAdmin = new Hono<{ Bindings: Env }>();

function trimEnv(v: string | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

uploadAdmin.post("/upload/presign", async (c) => {
  const env = c.env;
  const acc = trimEnv(env.R2_ACCOUNT_ID);
  const keyId = trimEnv(env.R2_ACCESS_KEY_ID);
  const secret = trimEnv(env.R2_SECRET_ACCESS_KEY);
  const pub = trimEnv(env.R2_PUBLIC_BASE_URL);
  const bucket = trimEnv(env.R2_BUCKET_NAME);
  if (!acc || !keyId || !secret)
    return c.json(
      {
        error: "presign_disabled",
        message:
          "Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (e.g. wrangler secret put … or apps/api/.dev.vars).",
      },
      501,
    );
  if (!pub || /^https?:\/\/pub-example\./i.test(pub))
    return c.json(
      {
        error: "r2_public_url_missing",
        message:
          "Set R2_PUBLIC_BASE_URL to your bucket’s public base (R2 dashboard → bucket → Public access → r2.dev URL).",
      },
      501,
    );
  if (!bucket)
    return c.json(
      {
        error: "r2_bucket_missing",
        message: "Set R2_BUCKET_NAME in wrangler [vars] (or env).",
      },
      501,
    );

  const raw = await c.req.json().catch(() => null) as {
    content_type?: string;
    recipe_id?: string;
    filename_hint?: string;
  } | null;
  const body = raw ?? {};

  const contentType =
    body?.content_type === "image/webp" ||
    body?.content_type === "image/jpeg" ||
    body?.content_type === "image/png"
      ? body.content_type
      : null;
  if (!contentType) return c.json({ error: "unsupported_type" }, 400);

  const recipePart =
    typeof body.recipe_id === "string" && body.recipe_id.trim()
      ? body.recipe_id.trim()
      : "draft";

  const ext = contentType.endsWith("webp")
    ? "webp"
    : contentType.endsWith("png")
      ? "png"
      : "jpg";
  const r2_key = `recipes/${recipePart}/${crypto.randomUUID()}.${ext}`;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${acc}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: r2_key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  let upload_url: string;
  try {
    upload_url = await getSignedUrl(client, command, { expiresIn: 300 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return c.json(
      {
        error: "presign_failed",
        message:
          "Could not build presigned URL. Check R2 API token (S3 read/write) and account ID match this bucket.",
        detail: msg,
      },
      502,
    );
  }
  void body?.filename_hint;

  return c.json({
    upload_url,
    r2_key,
    public_url: `${pub.replace(/\/$/, "")}/${r2_key}`,
  });
});
