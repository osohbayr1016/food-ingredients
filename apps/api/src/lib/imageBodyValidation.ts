/** R2 upload limits enforced while reading, not after buffering an untrusted body. */
export const MAX_RECIPE_IMAGE_BYTES = 12 * 1024 * 1024;
export type ImageReadResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; error: "empty_body" | "too_large" | "body_read_failed" };

export function supportedImageMime(value: string | null | undefined) {
  const ct = (value ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  return ct === "image/png" || ct === "image/webp" || ct === "image/jpeg" ? ct : null;
}

/** This is a content signature check, not full image decoding/virus scanning. */
export function imageMagicMatches(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((b, i) => bytes[i] === b);
  }
  if (mime === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
  }
  return false;
}

export async function readBoundedImageBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = MAX_RECIPE_IMAGE_BYTES,
): Promise<ImageReadResult> {
  if (!body) return { ok: false, error: "empty_body" };
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return { ok: false, error: "body_read_failed" };
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, error: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, error: "body_read_failed" };
  } finally {
    reader.releaseLock();
  }
  if (!size) return { ok: false, error: "empty_body" };
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}
