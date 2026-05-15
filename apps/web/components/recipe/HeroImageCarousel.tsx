"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";

type Props = {
  slides: string[];
  onIndexChange?: (index: number) => void;
};

/** Infinite horizontal snap carousel: clone last/first, jump on edges. */
export function HeroImageCarousel({ slides, onIndexChange }: Props) {
  const n = slides.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const jumpingRef = useRef(false);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const extended = useMemo(() => {
    if (n < 2) return slides;
    return [slides[n - 1]!, ...slides, slides[0]!];
  }, [n, slides]);

  const reportIndex = useCallback(
    (scrollIndex: number) => {
      if (n < 2) {
        onIndexChange?.(0);
        return;
      }
      if (scrollIndex >= 1 && scrollIndex <= n)
        onIndexChange?.(scrollIndex - 1);
    },
    [n, onIndexChange],
  );

  const settle = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || n < 2 || jumpingRef.current) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const i = Math.round(el.scrollLeft / w);
    if (i === 0) {
      jumpingRef.current = true;
      el.scrollTo({ left: n * w, behavior: "instant" });
      reportIndex(n);
      requestAnimationFrame(() => {
        jumpingRef.current = false;
      });
      return;
    }
    if (i === n + 1) {
      jumpingRef.current = true;
      el.scrollTo({ left: w, behavior: "instant" });
      reportIndex(1);
      requestAnimationFrame(() => {
        jumpingRef.current = false;
      });
      return;
    }
    reportIndex(i);
  }, [n, reportIndex]);

  useLayoutEffect(() => {
    if (n < 2) {
      onIndexChange?.(0);
      return;
    }
    const el = scrollerRef.current;
    if (!el) return;
    let placed = false;
    const place = () => {
      if (placed) return;
      const w = el.clientWidth;
      if (w <= 0) return;
      el.scrollLeft = w;
      placed = true;
      reportIndex(1);
    };
    place();
    const ro = new ResizeObserver(() => {
      if (!placed) place();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [n, slides, onIndexChange, reportIndex]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || n < 2) return;
    const arm = () => {
      if (settleRef.current) clearTimeout(settleRef.current);
      settleRef.current = setTimeout(settle, 140);
    };
    const onScrollEnd = () => {
      if (settleRef.current) clearTimeout(settleRef.current);
      settle();
    };
    el.addEventListener("scroll", arm, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    return () => {
      el.removeEventListener("scroll", arm);
      el.removeEventListener("scrollend", onScrollEnd);
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, [n, settle]);

  useEffect(() => {
    if (n < 2) return;
    const el = scrollerRef.current;
    if (!el) return;
    const id = setInterval(() => {
      if (jumpingRef.current || document.visibilityState === "hidden") return;
      const w = el.clientWidth;
      if (w <= 0) return;
      const i = Math.round(el.scrollLeft / w);
      if (i < 1 || i > n) return;
      if (i === n) el.scrollTo({ left: (n + 1) * w, behavior: "smooth" });
      else el.scrollTo({ left: (i + 1) * w, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, [n]);

  if (n === 0) return null;
  if (n === 1) {
    return (
      <img
        src={slides[0]}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      ref={scrollerRef}
      className="absolute inset-0 z-0 flex h-full w-full snap-x snap-mandatory overflow-y-hidden overflow-x-scroll overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x]"
      style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
    >
      {extended.map((src, idx) => (
        <div
          key={`${src}-${idx}`}
          className="relative h-full w-full min-w-full shrink-0 grow-0 snap-start"
          style={{ flex: "0 0 100%" }}
        >
          <img src={src} alt="" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
