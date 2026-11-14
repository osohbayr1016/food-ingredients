import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Hono } from "hono";
import type { Env } from "../../bindings";
import { safeRecipeUploadScope } from "../../lib/uploadKeyScope";
import { parsePresignImageRequest } from "../../lib/presignedImagePolicy";

export const uploadAdmin = new Hono<{ Bindings: Env }>();

function trimEnv(v: string | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

uploadAdmin.post("/upload/presign", async (c) => {
  const env = c.env;
  // The browser uses the binding route with validated bytes; presigned direct
  // R2 uploads are an explicitly enabled legacy escape hatch only.
  if (env.R2_PRESIGN_ENABLED !== "true")
    return c.json({error:"presign_disabled",message:"Use /admin/upload/image instead."},501);
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

  const body = await c.req.json().catch(() => null) as Record<string,unknown> | null;
  const parsed = parsePresignImageRequest(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const { contentType, sizeBytes } = parsed;

  const recipePart = safeRecipeUploadScope(body?.recipe_id);
  if (!recipePart) return c.json({ error: "bad_recipe_id" }, 400);

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
    ContentLength: sizeBytes,
    CacheControl: "public, max-age=31536000, immutable",
  });

  let upload_url: string;
  try {
    upload_url = await getSignedUrl(client, command, {
      expiresIn: 300,
      signableHeaders: new Set(["content-length", "content-type"]),
    });
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
  return c.json({
    upload_url,
    r2_key,
    public_url: `${pub.replace(/\/$/, "")}/${r2_key}`,
    required_headers: {"Content-Type":contentType,"Content-Length":String(sizeBytes)},
  });
});
