"use client";

import {
  clearProfile,
  dispatchLibrary,
  readLikedIds,
  readProfile,
  type FoodProfile,
} from "@/lib/profileStorage";
import { ProfileGuestGate } from "@/components/profile/ProfileGuestGate";
import { ProfileLibrarySection } from "@/components/profile/ProfileLibrarySection";
import { clientFetch } from "@/lib/clientApi";
import type { RecipeDetail, RecipeListItem } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

type Tab = "saved" | "liked";

async function fetchAsListItem(id: string): Promise<RecipeListItem | null> {
  try {
    const res = await clientFetch(`/recipes/${id}`);
    if (!res.ok) return null;
    const d = (await res.json()) as RecipeDetail;
    return d.recipe;
  } catch {
    return null;
  }
}

export default function ProfilePageClient() {
  const [profile, setProfile] = useState<FoodProfile | null>(null);
  const [tab, setTab] = useState<Tab>("saved");
  const [saved, setSaved] = useState<RecipeListItem[]>([]);
  const [liked, setLiked] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const syncShell = useCallback(() => setProfile(readProfile()), []);

  useEffect(() => {
    syncShell();
    window.addEventListener("food-library-changed", syncShell);
    return () => window.removeEventListener("food-library-changed", syncShell);
  }, [syncShell]);

  const reloadRecipes = useCallback(async () => {
    const p = readProfile();
    if (!p) {
      setSaved([]);
      setLiked([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sa = await clientFetch("/saved");
      const sj = (await sa.json()) as { saved: RecipeListItem[] };
      setSaved(Array.isArray(sj.saved) ? sj.saved : []);
      const ids = readLikedIds();
      const rows = await Promise.all(ids.map(fetchAsListItem));
      setLiked(rows.filter(Boolean) as RecipeListItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadRecipes();
    window.addEventListener("food-library-changed", reloadRecipes);
    return () => window.removeEventListener("food-library-changed", reloadRecipes);
  }, [reloadRecipes, profile]);

  if (!profile) return <ProfileGuestGate />;

  return (
    <ProfileLibrarySection
      profile={profile}
      tab={tab}
      setTab={setTab}
      loading={loading}
      saved={saved}
      liked={liked}
      onSignOut={() => {
        clearProfile();
        dispatchLibrary();
        setProfile(null);
      }}
    />
  );
}
