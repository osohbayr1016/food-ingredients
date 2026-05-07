"use client";

import { isLikedId, toggleLikedId } from "@/lib/profileStorage";
import { useEffect, useState } from "react";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 7-3 4.5 4.5 0 0 1 7 3c0 5.65-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="1.7"
        fill={filled ? "currentColor" : "none"}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RecipeLikeButton({
  recipeId,
  variant,
}: {
  recipeId: string;
  variant: "card" | "hero";
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isLikedId(recipeId));
    function refresh() {
      setOn(isLikedId(recipeId));
    }
    window.addEventListener("food-library-changed", refresh);
    return () => window.removeEventListener("food-library-changed", refresh);
  }, [recipeId]);

  function click(e?: React.MouseEvent) {
    e?.stopPropagation();
    e?.preventDefault();
    setOn(toggleLikedId(recipeId));
  }

  const base =
    "flex shrink-0 items-center justify-center rounded-full touch-manipulation";
  const ring =
    variant === "hero"
      ? "h-10 w-10 border border-white/30 bg-white/25 text-white backdrop-blur-md"
      : "h-9 w-9 text-white shadow-md";
  const tint = variant === "card" ? { backgroundColor: "rgba(226,62,62,0.92)" } : undefined;

  return (
    <button
      type="button"
      onClick={click}
      className={`${base} ${ring}`}
      style={tint}
      aria-label={on ? "Unlike recipe" : "Like recipe"}
    >
      <HeartIcon filled={on} />
    </button>
  );
}
