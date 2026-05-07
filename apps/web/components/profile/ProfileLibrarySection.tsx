"use client";

import Link from "next/link";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import type { RecipeListItem } from "@/lib/types";
import type { FoodProfile } from "@/lib/profileStorage";

type Tab = "saved" | "liked";

export function ProfileLibrarySection({
  profile,
  tab,
  setTab,
  loading,
  saved,
  liked,
  onSignOut,
}: {
  profile: FoodProfile;
  tab: Tab;
  setTab: (t: Tab) => void;
  loading: boolean;
  saved: RecipeListItem[];
  liked: RecipeListItem[];
  onSignOut: () => void;
}) {
  const initial = profile.name.slice(0, 1).toUpperCase();

  return (
    <main className="space-y-5 py-5">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-600">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-zinc-900">{profile.name}</h1>
            <p className="truncate text-sm text-zinc-500">{profile.handle}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href="/login"
            className="rounded-full border border-(--figma-primary) px-3 py-1.5 text-xs font-semibold text-(--figma-primary) touch-manipulation"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs text-zinc-400 touch-manipulation"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex divide-x divide-zinc-100 rounded-2xl border border-zinc-100 bg-zinc-50/80 py-4 text-center text-sm">
        <div className="flex flex-1 flex-col gap-0.5 px-2">
          <span className="text-lg font-bold text-zinc-900">{saved.length}</span>
          <span className="text-xs text-zinc-500">Saved</span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-2">
          <span className="text-lg font-bold text-zinc-900">{liked.length}</span>
          <span className="text-xs text-zinc-500">Liked</span>
        </div>
      </div>

      <div className="flex border-b border-zinc-200">
        {(["saved", "liked"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 touch-manipulation border-b-2 py-3 text-sm font-semibold capitalize ${
              tab === t
                ? "-mb-px border-(--figma-primary) text-(--figma-primary)"
                : "border-transparent text-zinc-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
      ) : tab === "saved" ? (
        saved.length ? (
          <RecipeGrid recipes={saved} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">No saved recipes yet.</p>
        )
      ) : liked.length ? (
        <RecipeGrid recipes={liked} />
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">No liked recipes yet.</p>
      )}
    </main>
  );
}
