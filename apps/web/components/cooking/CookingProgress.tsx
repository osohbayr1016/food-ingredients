export function CookingProgress({ index, total }: { index: number; total: number }) {
  const pct = Math.max(5, Math.round(((index + 1) / total) * 100));
  return (
    <div className="fixed top-[env(safe-area-inset-top)] left-4 right-4 z-40 max-w-xl mx-auto">
      <div className="h-1 rounded-full bg-white/10 overflow-hidden backdrop-blur">
        <div
          className="h-full rounded-full bg-amber-400 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-zinc-400 mt-1 text-center">
        Алхам {Math.min(total, index + 1)} / {total}
      </p>
    </div>
  );
}
