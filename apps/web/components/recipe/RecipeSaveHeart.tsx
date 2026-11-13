"use client";

import { clientFetch } from "@/lib/clientApi";
import { getRecipeLibraryIds, updateRecipeLibraryId } from "@/lib/recipeLibraryCache";
import { dispatchLibrary } from "@/lib/profileStorage";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const primary = "#276440";

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
  const { user, ready } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!user) {
        setSaved(false);
        setLoading(false);
        return;
      }
      void getRecipeLibraryIds(user.id, "saved")
        .then(ids => {
          if (!cancelled) { setSaved(ids.has(recipeId)); setFailed(false); }
        })
        .catch(() => { if (!cancelled) setFailed(true); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    setLoading(true);
    refresh();
    window.addEventListener("food-library-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("food-library-changed", refresh);
    };
  }, [recipeId, user?.id]);

  async function toggle(e?: React.MouseEvent) {
    e?.stopPropagation();
    e?.preventDefault();
    if (!ready) return;
    if (!user) {
      const next = pathname
        ? `?next=${encodeURIComponent(pathname)}&reason=save`
        : "?reason=save";
      router.push(`/login${next}`);
      return;
    }
    setBusy(true);
    try {
      if (failed) {
        const ids = await getRecipeLibraryIds(user.id, "saved");
        setSaved(ids.has(recipeId));
        setFailed(false);
        return; // retry the read first; do not toggle an unknown server state
      }
      const next = !saved;
      const res = saved
        ? await clientFetch(`/saved/${recipeId}`, { method: "DELETE" })
        : await clientFetch("/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipe_id: recipeId }),
          });
      if (!res.ok) throw new Error("save_failed");
      updateRecipeLibraryId(user.id, "saved", recipeId, next);
      setSaved(next);
      setFailed(false);
      dispatchLibrary();
    } catch {
      setFailed(true);
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
      disabled={busy || loading}
      onClick={toggle}
      className={className}
      style={style}
      aria-label={failed ? "Хадгалах үед алдаа гарсан. Дахин оролдох" : saved ? "Хадгалснаас хасах" : "Жор хадгалах"}
    >
      <BookmarkIcon filled={saved} />
    </button>
  );
}
