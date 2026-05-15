"use client";

export function SuggestPantryScanActions({
  selectedSize,
  busy,
  canSuggest,
  onAddOnly,
  onAddAndSuggest,
}: {
  selectedSize: number;
  busy: boolean;
  canSuggest: boolean;
  onAddOnly: () => void;
  onAddAndSuggest: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={!selectedSize || busy}
        onClick={onAddOnly}
        className="w-full rounded-xl bg-zinc-900 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Зөвхөн орц руу нэмэх ({selectedSize})
      </button>
      {canSuggest ? (
        <button
          type="button"
          disabled={!selectedSize || busy}
          onClick={onAddAndSuggest}
          className="w-full rounded-xl bg-(--figma-primary) py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Нэмээд жор санал болгох
        </button>
      ) : null}
    </div>
  );
}
