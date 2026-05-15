/** L2-normalize each row of a row-major [rows, cols] matrix. */
export function l2NormalizeRows(
  data: Float32Array,
  rows: number,
  cols: number,
): Float32Array {
  const out = new Float32Array(data.length);
  for (let r = 0; r < rows; r++) {
    let sum = 0;
    const o = r * cols;
    for (let c = 0; c < cols; c++) sum += data[o + c]! * data[o + c]!;
    const inv = sum > 0 ? 1 / Math.sqrt(sum) : 0;
    for (let c = 0; c < cols; c++) out[o + c] = data[o + c]! * inv;
  }
  return out;
}

/** Dot product of one image embedding with each row of normalized text embeddings. */
export function dotImageWithTextRows(
  imageRow: Float32Array,
  textRowsNorm: Float32Array,
  batch: number,
  hidden: number,
): number[] {
  const logits: number[] = [];
  for (let b = 0; b < batch; b++) {
    let acc = 0;
    const o = b * hidden;
    for (let i = 0; i < hidden; i++) acc += imageRow[i]! * textRowsNorm[o + i]!;
    logits.push(acc);
  }
  return logits;
}

export function toFloat32(tensorData: Float32Array | number[]): Float32Array {
  return tensorData instanceof Float32Array
    ? tensorData
    : Float32Array.from(tensorData);
}

/** Pool flat prompt logits → one score per canonical (max over prompts per row). */
export function maxPoolFlatLogitsToCanon(
  flatLogits: number[],
  canonIndexForPrompt: number[],
  numCanons: number,
): Float32Array {
  const best = new Float32Array(numCanons).fill(Number.NEGATIVE_INFINITY);
  for (let i = 0; i < flatLogits.length; i++) {
    const ci = canonIndexForPrompt[i]!;
    const v = flatLogits[i]!;
    if (v > best[ci]!) best[ci] = v;
  }
  for (let c = 0; c < numCanons; c++) if (!Number.isFinite(best[c]!)) best[c] = 0;
  return best;
}
