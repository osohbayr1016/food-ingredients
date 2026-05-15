import type { CanonRow } from "@/lib/pantryImage/sanitizeCanonRows";
import {
  dotImageWithTextRows,
  l2NormalizeRows,
  maxPoolFlatLogitsToCanon,
  toFloat32,
} from "@/lib/pantryImage/clipEmbedMath";
import { flattenClipPromptPlan } from "@/lib/pantryImage/clipIngredientPrompts";
import { loadClipModel } from "./loadClipModel";
import { prepImageBlob } from "./prepImageBlob";
import { sanitizeCanonRows } from "./sanitizeCanonRows";

const CHUNK = 40;

export type PantryScanHit = {
  canonical_id: string;
  name: string;
  score: number;
};

function softmaxVec(x: Float32Array): Float32Array {
  let m = -Infinity;
  for (let i = 0; i < x.length; i++) if (x[i] > m) m = x[i];
  let sum = 0;
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    out[i] = Math.exp(x[i] - m);
    sum += out[i];
  }
  for (let i = 0; i < x.length; i++) out[i] /= sum;
  return out;
}

/** Map pantry photo → top‑K canon ingredients via CLIP vision/text embeds + dots (no fused CLIPModel). */
export async function runPantryImageScan(
  imageBlob: Blob,
  canonicals: CanonRow[],
  opts?: { topK?: number },
): Promise<PantryScanHit[]> {
  const topK = opts?.topK ?? 18;
  const rows = sanitizeCanonRows(canonicals);
  if (!rows.length) return [];

  const blob = await prepImageBlob(imageBlob);
  const { vision_model, text_model, tokenizer, processor, RawImage } =
    await loadClipModel();

  const objectUrl = URL.createObjectURL(blob);
  let rawImage;
  try {
    rawImage = await RawImage.read(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const image_inputs = await processor(rawImage);
  const visionOut = await vision_model(image_inputs as object);
  const vi = visionOut?.image_embeds;
  if (!vi?.dims || vi.dims.length < 2 || !vi.data) {
    throw new Error("CLIP vision returned no embeddings");
  }
  const hidden = Number(vi.dims[vi.dims.length - 1]);
  const imgData = l2NormalizeRows(toFloat32(vi.data), 1, hidden);
  const imageRow = imgData.subarray(0, hidden);

  const { prompts: flatPrompts, canonIndexForPrompt } = flattenClipPromptPlan(rows);
  if (!flatPrompts.length) return [];

  const allFlatLogits: number[] = [];
  for (let i = 0; i < flatPrompts.length; i += CHUNK) {
    const texts = flatPrompts.slice(i, i + CHUNK);
    const text_inputs = tokenizer(texts, { padding: true, truncation: true });
    const textOut = await text_model(text_inputs as object);
    const te = textOut?.text_embeds;
    if (!te?.dims || te.dims.length < 2 || !te.data) {
      throw new Error("CLIP text returned no embeddings");
    }
    const batch = Number(te.dims[0]);
    const d = Number(te.dims[te.dims.length - 1]);
    if (d !== hidden) throw new Error("CLIP text/vision dims mismatch");
    const texData = toFloat32(te.data);
    const textNorm = l2NormalizeRows(texData, batch, d);
    allFlatLogits.push(...dotImageWithTextRows(imageRow, textNorm, batch, d));
  }

  if (allFlatLogits.length !== flatPrompts.length) {
    throw new Error("CLIP flat logit length mismatch");
  }

  const perCanon = maxPoolFlatLogitsToCanon(
    allFlatLogits,
    canonIndexForPrompt,
    rows.length,
  );
  const probs = softmaxVec(perCanon);
  const ranked = [...probs].map((score, idx) => ({ score, idx }));
  ranked.sort((a, b) => b.score - a.score);

  const hits: PantryScanHit[] = [];
  const n = Math.min(topK, ranked.length);
  for (let k = 0; k < n; k++) {
    const { idx, score } = ranked[k]!;
    const c = rows[idx]!;
    hits.push({ canonical_id: c.canonical_id, name: c.name, score });
  }
  return hits;
}
