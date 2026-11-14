"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { shouldAutoplayCarousel } from "@/lib/carouselMotion";

type Props = {
  slides: string[];
  onIndexChange?: (index: number) => void;
};

/** Infinite horizontal snap carousel: clone last/first, jump on edges. */
export function HeroImageCarousel({ slides, onIndexChange }: Props) {
  const n = slides.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const jumpingRef = useRef(false);
  const hoveringRef = useRef(false);
  const focusRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const reducedMotionRef = useRef(false);
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
    const media=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update=()=>{ reducedMotionRef.current=media.matches; };
    update();
    media.addEventListener?.("change",update);
    return ()=>media.removeEventListener?.("change",update);
  }, []);

  useEffect(() => {
    if (n < 2) return;
    const el = scrollerRef.current;
    if (!el) return;
    const id = setInterval(() => {
      if (jumpingRef.current || !shouldAutoplayCarousel({
        slides:n,visible:document.visibilityState!=="hidden",
        reducedMotion:reducedMotionRef.current,
        hovering:hoveringRef.current,focused:focusRef.current,
        now:Date.now(),lastInteraction:lastInteractionRef.current,
      })) return;
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
      role="region"
      aria-roledescription="carousel"
      aria-label="Жорын зургууд"
      tabIndex={0}
      onMouseEnter={() => { hoveringRef.current = true; }}
      onMouseLeave={() => { hoveringRef.current = false; }}
      onFocus={() => { focusRef.current = true; }}
      onBlur={() => { focusRef.current = false; }}
      onWheel={() => { lastInteractionRef.current = Date.now(); }}
      onTouchStart={() => { lastInteractionRef.current = Date.now(); }}
      onPointerDown={() => { lastInteractionRef.current = Date.now(); }}
      onKeyDown={event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        const el=scrollerRef.current;
        if (!el || !el.clientWidth) return;
        event.preventDefault();
        lastInteractionRef.current=Date.now();
        const current=Math.round(el.scrollLeft / el.clientWidth);
        const next=Math.max(0,Math.min(n+1,current+(event.key==="ArrowRight"?1:-1)));
        el.scrollTo({left:next*el.clientWidth,behavior:"smooth"});
      }}
      className="absolute inset-0 z-0 flex h-full w-full focus-visible:outline-2 focus-visible:outline-white snap-x snap-mandatory overflow-y-hidden overflow-x-scroll overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x]"
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
