"use client";

import { clientFetch } from "@/lib/clientApi";
import {
  dispatchLibrary,
  isLikedId,
  toggleLikedId,
} from "@/lib/profileStorage";
import { useAuth } from "@/components/auth/AuthContext";
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
  const { user, ready } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) setOn(isLikedId(recipeId));
        return;
      }
      const res = await clientFetch(`/likes/${recipeId}`);
      const j = (await res.json()) as { liked?: boolean };
      if (!cancelled) setOn(!!j.liked);
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId, user]);

  useEffect(() => {
    function refresh() {
      if (!user) {
        setOn(isLikedId(recipeId));
        return;
      }
      void (async () => {
        const res = await clientFetch(`/likes/${recipeId}`);
        const j = (await res.json()) as { liked?: boolean };
        setOn(!!j.liked);
      })();
    }
    window.addEventListener("food-library-changed", refresh);
    return () => window.removeEventListener("food-library-changed", refresh);
  }, [recipeId, user]);

  async function click(e?: React.MouseEvent) {
    e?.stopPropagation();
    e?.preventDefault();
    if (!ready) return;
    if (!user) {
      setBusy(true);
      try {
        const nextOn = toggleLikedId(recipeId);
        setOn(nextOn);
        dispatchLibrary();
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      if (on) {
        await clientFetch(`/likes/${recipeId}`, { method: "DELETE" });
        setOn(false);
      } else {
        await clientFetch("/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipeId }),
        });
        setOn(true);
      }
      dispatchLibrary();
    } finally {
      setBusy(false);
    }
  }

  const base =
    "flex shrink-0 items-center justify-center rounded-full touch-manipulation";
  const ring =
    variant === "hero"
      ? "h-10 w-10 border border-white/30 bg-white/25 text-white backdrop-blur-md"
      : "h-9 w-9 text-white shadow-md";
  const tint =
    variant === "card" ? { backgroundColor: "rgba(226,62,62,0.92)" } : undefined;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={click}
      className={`${base} ${ring}`}
      style={tint}
      aria-label={on ? "Unlike recipe" : "Like recipe"}
    >
      <HeartIcon filled={on} />
    </button>
  );
}
