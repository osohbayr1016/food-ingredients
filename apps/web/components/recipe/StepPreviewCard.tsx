export function StepPreviewCard({
  order,
  text,
}: {
  order: number;
  text: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Step {order}
      </p>
      <p className="text-sm leading-relaxed text-zinc-800">{text}</p>
    </div>
  );
}
