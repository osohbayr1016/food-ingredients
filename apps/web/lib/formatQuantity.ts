export function formatQuantity(q: number) {
  const abs = Math.abs(q);
  const fracs: [number, string][] = [
    [0.125, "⅛"],
    [0.25, "¼"],
    [0.33, "⅓"],
    [0.5, "½"],
    [0.66, "⅔"],
    [0.75, "¾"],
  ];
  const whole = Math.floor(abs + 1e-9);
  const rem = abs - whole;

  for (const [n, sym] of fracs) {
    if (Math.abs(rem - n) < 0.04) {
      if (whole === 0) return q < 0 ? `-${sym}` : sym;
      const w = q < 0 ? -whole : whole;
      return `${w} ${sym}`.trim();
    }
  }

  const rounded = Math.round(abs * 100) / 100;
  return `${q < 0 ? "-" : ""}${rounded}`;
}
