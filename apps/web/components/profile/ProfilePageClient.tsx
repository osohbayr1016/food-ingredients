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

  const reloadRecipes = useCallback(async () => {
    if (!user) {
      setSaved([]);
      setLiked([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sa, li] = await Promise.all([
        clientFetch("/saved"),
        clientFetch("/likes"),
      ]);
      const sj = (await sa.json()) as { saved: RecipeListItem[] };
      const lj = (await li.json()) as { liked: RecipeListItem[] };
      setSaved(Array.isArray(sj.saved) ? sj.saved : []);
      setLiked(Array.isArray(lj.liked) ? lj.liked : []);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      saved={saved}
      liked={liked}
      onSignOut={logout}
    />
  );
}
