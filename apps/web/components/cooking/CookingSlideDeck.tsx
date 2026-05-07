"use client";

import {
  type ReactNode,
  type UIEventHandler,
  useCallback,
  useEffect,
  useRef,
} from "react";

export function CookingSlideDeck({
  index,
  total,
  onIndexChange,
  renderSlide,
}: {
  index: number;
  total: number;
  onIndexChange: (n: number) => void;
  renderSlide: (i: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    el.scrollTo({ left: index * w, behavior: "smooth" });
  }, [index]);

  const handleScroll = useCallback<UIEventHandler<HTMLDivElement>>(
    () => {
      cancelAnimationFrame(raf.current);
      raf.current = window.requestAnimationFrame(() => {
        const el = ref.current;
        if (!el || !el.clientWidth) return;
        const target = Math.min(
          total - 1,
          Math.max(0, Math.round(el.scrollLeft / el.clientWidth)),
        );
        if (target !== index) onIndexChange(target);
      });
    },
    [index, onIndexChange, total],
  );

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="no-scrollbar flex h-dvh w-full scroll-smooth snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain bg-zinc-950 touch-pan-x"
    >
      {Array.from({ length: total }).map((_, i) => (
        <section
          key={`slide-${i}`}
          className="relative flex h-dvh max-h-dvh min-h-0 w-full min-w-full shrink-0 snap-center snap-always flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain px-6 pb-44 pt-[calc(env(safe-area-inset-top)+4.5rem)] [-webkit-overflow-scrolling:touch] touch-pan-y">
            {renderSlide(i)}
          </div>
        </section>
      ))}
    </div>
  );
}
