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
  /** Ignore scroll echo while we align programmatically (Prev/Next buttons). */
  const syncing = useRef(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const desired = index * w;
    // User swipe already landed on this slide — do not scroll again (fixes “moves one more time”).
    if (Math.abs(el.scrollLeft - desired) < 8) return;

    syncing.current = true;
    el.scrollTo({ left: desired, behavior: "auto" });
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, [index]);

  const handleScroll = useCallback<UIEventHandler<HTMLDivElement>>(() => {
    if (syncing.current) return;
    cancelAnimationFrame(raf.current);
    raf.current = window.requestAnimationFrame(() => {
      const el = ref.current;
      if (!el || !el.clientWidth || syncing.current) return;
      const w = el.clientWidth;
      const target = Math.min(
        total - 1,
        Math.max(0, Math.round(el.scrollLeft / w)),
      );
      if (target === indexRef.current) return;
      onIndexChange(target);
    });
  }, [onIndexChange, total]);

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="no-scrollbar flex h-dvh w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain bg-zinc-950 touch-pan-x [scrollbar-width:none]"
    >
      {Array.from({ length: total }).map((_, i) => (
        <section
          key={`slide-${i}`}
          className="relative flex h-dvh max-h-dvh min-h-0 w-full min-w-full shrink-0 snap-center snap-always flex-col"
        >
          <div className="flex min-h-0 max-h-full flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain px-6 pb-56 pt-[calc(env(safe-area-inset-top)+4.5rem)] [-webkit-overflow-scrolling:touch]">
            {renderSlide(i)}
          </div>
        </section>
      ))}
    </div>
  );
}
