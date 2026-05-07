"use client";

import { clientFetch } from "@/lib/clientApi";
import { dispatchLibrary, readProfile } from "@/lib/profileStorage";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const primary = "#E23E3E";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4h12v16l-6-3-6 3V4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function RecipeSaveHeart({
  recipeId,
  variant = "overlay",
}: {
  recipeId: string;
  variant?: "overlay" | "card" | "hero";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await clientFetch("/saved");
      const payload = await res.json();
      const list = payload.saved ?? [];
      if (!cancelled) {
        setSaved(Array.isArray(list) && list.some((r: { id: string }) => r.id === recipeId));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  async function toggle(e?: React.MouseEvent) {
    e?.stopPropagation();
    e?.preventDefault();
    if (!readProfile()) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}&reason=save` : "?reason=save";
      router.push(`/login${next}`);
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        await clientFetch(`/saved/${recipeId}`, { method: "DELETE" });
        setSaved(false);
      } else {
        await clientFetch("/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipeId }),
        });
        setSaved(true);
      }
      dispatchLibrary();
    } finally {
      setBusy(false);
    }
  }

  const base =
    "flex shrink-0 items-center justify-center rounded-full touch-manipulation disabled:opacity-50";
  const size = variant === "card" ? "h-9 w-9" : "h-10 w-10";

  const className =
    variant === "card"
      ? `${base} ${size} text-white shadow-md`
      : variant === "hero"
        ? `${base} ${size} border border-white/30 bg-white/25 text-white backdrop-blur-md`
        : `${base} ${size} bg-black/50 text-white backdrop-blur ${saved ? "text-rose-200" : ""}`;

  const style = variant === "card" ? { backgroundColor: primary } : undefined;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className={className}
      style={style}
      aria-label={saved ? "Remove from saved" : "Save recipe"}
    >
      <BookmarkIcon filled={saved} />
    </button>
  );
}
