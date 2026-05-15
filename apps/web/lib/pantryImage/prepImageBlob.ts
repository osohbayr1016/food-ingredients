/** Downscale large photos to reduce CLIP memory/time. */
export async function prepImageBlob(blob: Blob, maxSide = 896): Promise<Blob> {
  const bmp = await createImageBitmap(blob);
  const w = bmp.width;
  const h = bmp.height;
  if (w <= maxSide && h <= maxSide) {
    bmp.close();
    return blob;
  }
  const scale = maxSide / Math.max(w, h);
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    return blob;
  }
  ctx.drawImage(bmp, 0, 0, tw, th);
  bmp.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
}
