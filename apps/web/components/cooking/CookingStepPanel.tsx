"use client";

import { interpolateStep } from "@/lib/interpolateStep";
import type { StepRow } from "@/lib/types";

export function CookingStepPanel({
  step,
  index,
  total,
  subs,
  upsert,
  onFinish,
}: {
  step: StepRow;
  index: number;
  total: number;
  subs: Record<string, string>;
  upsert: (o: { id: string; label: string; seconds: number }) => void;
  onFinish: () => void;
}) {
  const body = step.description_template?.trim()
    ? interpolateStep(step.description_template, subs)
    : step.description;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 pb-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Алхам {index + 1}
      </p>
      <p className="text-xl font-semibold leading-relaxed text-zinc-50 sm:text-2xl">{body}</p>
      {step.tip && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-50/95">
          {step.tip}
        </div>
      )}
      {!!step.timer_seconds && (
        <button
          type="button"
          className="w-fit rounded-full bg-white/10 px-4 py-3 text-sm font-semibold touch-manipulation active:bg-white/15"
          onClick={() =>
            upsert({
              id: `step-${step.id}`,
              label: `Алхам ${index + 1}`,
              seconds: step.timer_seconds ?? 0,
            })
          }
        >
          Таймер эхлүүлэх ({step.timer_seconds}s)
        </button>
      )}
      {index === total - 1 && (
        <button
          type="button"
          className="mt-4 w-full max-w-xs rounded-full bg-amber-500 py-3.5 font-semibold text-black touch-manipulation active:brightness-95"
          onClick={onFinish}
        >
          Дуусгах
        </button>
      )}
    </div>
  );
}
