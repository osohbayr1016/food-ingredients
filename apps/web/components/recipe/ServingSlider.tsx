export function ServingSlider({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block space-y-2 text-xs text-zinc-500">
      <div className="flex justify-between text-sm text-zinc-900">
        <span>Servings</span>
        <span className="font-semibold text-(--figma-primary)">{value} servings</span>
      </div>
      <input
        type="range"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-rose-500 touch-manipulation"
        style={{ accentColor: "var(--figma-primary)" }}
      />
    </label>
  );
}
