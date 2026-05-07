export async function fileToWebp(file: File): Promise<{ blob: Blob; type: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: file, type: file.type || "image/jpeg" };
    ctx.drawImage(bitmap, 0, 0);
    const blob =
      await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", 0.82),
      );
    if (blob) return { blob, type: "image/webp" };
  } catch {
    /* noop */
  }
  return { blob: file, type: file.type || "image/jpeg" };
}
