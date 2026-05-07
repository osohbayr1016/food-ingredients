import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Hono } from "hono";
import type { Env } from "../../bindings";

export const uploadAdmin = new Hono<{ Bindings: Env }>();

uploadAdmin.post("/upload/presign", async (c) => {
  const env = c.env;
  const acc = env.R2_ACCOUNT_ID.trim();
  const keyId = env.R2_ACCESS_KEY_ID.trim();
  const secret = env.R2_SECRET_ACCESS_KEY.trim();
  if (!acc || !keyId || !secret) return c.json({ error: "presign_disabled" }, 501);

  const raw = await c.req.json().catch(() => null) as {
    content_type?: string;
    recipe_id?: string;
    filename_hint?: string;
  } | null;
  const body = raw ?? {};

  const contentType =
    body?.content_type === "image/webp" || body?.content_type === "image/jpeg"
      ? body.content_type
      : null;
  if (!contentType) return c.json({ error: "unsupported_type" }, 400);

  const recipePart =
    typeof body.recipe_id === "string" && body.recipe_id.trim()
      ? body.recipe_id.trim()
      : "draft";

  const ext = contentType.endsWith("webp") ? "webp" : "jpg";
  const r2_key = `recipes/${recipePart}/${crypto.randomUUID()}.${ext}`;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${acc}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  });

    const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: r2_key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const upload_url = await getSignedUrl(client, command, { expiresIn: 300 });
  void body?.filename_hint;

  return c.json({
    upload_url,
    r2_key,
    public_url: `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${r2_key}`,
  });
});
