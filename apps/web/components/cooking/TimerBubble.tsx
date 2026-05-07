"use client";

import type { BubbleTimerState } from "@/hooks/useBubbleTimers";

export function TimerBubbleRow({
  timer,
  text,
  onDismiss,
}: {
  timer: BubbleTimerState;
  text: string;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-full bg-zinc-900/90 px-4 py-2 border border-white/10 text-xs">
      <span className="truncate pr-3">{timer.label}</span>
      <span className="font-semibold">{text}</span>
      <button
        type="button"
        onClick={() => onDismiss(timer.id)}
        className="ml-2 text-zinc-500 touch-manipulation"
      >
        ×
      </button>
    </div>
  );
}

export function TimerBubbleStack({
  timers,
  label,
  onDismiss,
}: {
  timers: BubbleTimerState[];
  label: (t: BubbleTimerState) => string;
  onDismiss: (id: string) => void;
}) {
  if (!timers.length) return null;
  return (
    <div
      className="fixed left-4 right-4 z-40 pointer-events-none"
      style={{ bottom: `calc(env(safe-area-inset-bottom) + 140px)` }}
    >
      <div className="pointer-events-auto space-y-2 max-w-xl mx-auto">
        {timers.map((timer) => (
          <TimerBubbleRow
            key={timer.id}
            timer={timer}
            text={label(timer)}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
