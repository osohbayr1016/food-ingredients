"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfileGuestIdentityForm } from "@/components/profile/ProfileGuestIdentityForm";
import { ProfileNutritionGuest } from "@/components/profile/ProfileNutritionGuest";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import {
  readLikedIds,
  readProfile,
  removeLikedIdsFromStorage,
} from "@/lib/profileStorage";
import { fetchGuestLikedRecipes } from "@/lib/guestLikedRecipeFetch";
import type { RecipeListItem } from "@/lib/types";

type Tab = "saved" | "liked";

export function ProfileGuestSection() {
  const [tab, setTab] = useState<Tab>("saved");
  const [liked, setLiked] = useState<RecipeListItem[]>([]);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [, setBump] = useState(0);

  const loadLiked = useCallback(async () => {
    const ids = readLikedIds();
    if (!ids.length) {
      setLiked([]);
      return;
    }
    setLoadingLiked(true);
    try {
      const { recipes, missingIds } = await fetchGuestLikedRecipes(ids);
      if (missingIds.length) removeLikedIdsFromStorage(missingIds);
      setLiked(recipes);
    } finally {
      setLoadingLiked(false);
    }
  }, []);

  useEffect(() => {
    void loadLiked();
  }, [loadLiked]);

  useEffect(() => {
    function onLib() {
      void loadLiked();
      setBump((n) => n + 1);
    }
    window.addEventListener("food-library-changed", onLib);
    return () => window.removeEventListener("food-library-changed", onLib);
  }, [loadLiked]);

  const display = readProfile();
  const initial = (display?.name.slice(0, 1) ?? "?").toUpperCase();

  return (
    <main className="space-y-5 py-5">
      <header className="flex items-start gap-4 border-b border-zinc-100 pb-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-600">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-zinc-900">Зочин профайл</h1>
          <p className="text-sm text-zinc-500">
            {display ? `${display.name} · ${display.handle}` : "Нэрээ хадгалж, дуртай жороо энд харна."}
          </p>
        </div>
      </header>

      <ProfileGuestIdentityForm onSaved={() => setBump((n) => n + 1)} />

      <ProfileNutritionGuest />

      <div className="flex divide-x divide-zinc-100 rounded-2xl border border-zinc-100 bg-zinc-50/80 py-4 text-center text-sm">
        <div className="flex flex-1 flex-col gap-0.5 px-2">
          <span className="text-lg font-bold text-zinc-900">—</span>
          <span className="text-xs text-zinc-500">Хадгалсан</span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-2">
          <span className="text-lg font-bold text-zinc-900">{readLikedIds().length}</span>
          <span className="text-xs text-zinc-500">Дуртай</span>
        </div>
      </div>

      <div className="flex border-b border-zinc-200">
        {(["saved", "liked"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 touch-manipulation border-b-2 py-3 text-sm font-semibold ${
              tab === t
                ? "-mb-px border-(--figma-primary) text-(--figma-primary)"
                : "border-transparent text-zinc-500"
            }`}
          >
            {t === "saved" ? "Хадгалсан" : "Дуртай"}
          </button>
        ))}
      </div>

      {tab === "saved" ? (
        <div className="space-y-4 py-6 text-center text-sm text-zinc-600">
          <p>Хадгалсан жор нэвтэрсний дараа серверт хадгалагдана.</p>
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/login"
              className="w-full max-w-[280px] rounded-full bg-(--figma-primary) py-3 text-sm font-semibold text-white"
            >
              Нэвтрэх
            </Link>
            <Link href="/signup" className="text-sm font-semibold text-(--figma-primary)">
              Шинээр бүртгүүлэх
            </Link>
          </div>
        </div>
      ) : loadingLiked ? (
        <p className="py-8 text-center text-sm text-zinc-500">Ачааллаж байна…</p>
      ) : liked.length ? (
        <RecipeGrid recipes={liked} />
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">Дуртай жор байхгүй.</p>
      )}
    </main>
  );
}
