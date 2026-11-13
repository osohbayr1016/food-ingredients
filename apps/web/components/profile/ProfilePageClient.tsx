"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { ProfileGuestSection } from "@/components/profile/ProfileGuestSection";
import { ProfileLibrarySection } from "@/components/profile/ProfileLibrarySection";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeListItem } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export default function ProfilePageClient() {
  const { user, ready, logout } = useAuth();
  const [tab, setTab] = useState<"saved" | "liked" | "nutrition">("saved");
  const [saved, setSaved] = useState<RecipeListItem[]>([]);
  const [liked, setLiked] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  const reloadRecipes = useCallback(async () => {
    if (!user) {
      setSaved([]);
      setLiked([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const [sa, li] = await Promise.all([
        clientFetch("/saved"),
        clientFetch("/likes"),
      ]);
      if (!sa.ok || !li.ok) throw new Error("library_fetch_failed");
      const sj = await sa.json() as { saved?: RecipeListItem[] };
      const lj = await li.json() as { liked?: RecipeListItem[] };
      if (!Array.isArray(sj.saved) || !Array.isArray(lj.liked)) throw new Error("library_invalid_response");
      setSaved(sj.saved);
      setLiked(lj.liked);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, retry]);

  useEffect(() => {
    reloadRecipes();
  }, [reloadRecipes]);

  useEffect(() => {
    function onLib() {
      void reloadRecipes();
    }
    window.addEventListener("food-library-changed", onLib);
    return () => window.removeEventListener("food-library-changed", onLib);
  }, [reloadRecipes]);

  if (!ready) {
    return (
      <p className="py-14 text-center text-sm text-zinc-500">Ачааллаж байна…</p>
    );
  }

  if (!user) return <ProfileGuestSection />;

  return (
    <ProfileLibrarySection
      user={user}
      tab={tab}
      setTab={setTab}
      loading={loading}
      error={error}
      onRetry={() => setRetry(value => value+1)}
      saved={saved}
      liked={liked}
      onSignOut={logout}
    />
  );
}
