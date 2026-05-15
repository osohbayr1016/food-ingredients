"use client";

import type { AuthUser } from "@/components/auth/AuthContext";
import Link from "next/link";
import { ProfileNutritionAccount } from "@/components/profile/ProfileNutritionAccount";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import type { RecipeListItem } from "@/lib/types";

type Tab = "saved" | "liked" | "nutrition";

export function ProfileLibrarySection({
  user,
  tab,
  setTab,
  loading,
  saved,
  liked,
  onSignOut,
}: {
  user: AuthUser;
  tab: Tab;
  setTab: (t: Tab) => void;
  loading: boolean;
  saved: RecipeListItem[];
  liked: RecipeListItem[];
  onSignOut: () => void;
}) {
  const initial = user.username.slice(0, 1).toUpperCase();
  const roleLabel = user.role === "admin" ? "Админ" : "Хэрэглэгч";

  return (
    <main className="space-y-5 py-5">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-600">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-zinc-900">
              {user.username}
            </h1>
            <p className="truncate text-sm text-zinc-500">{roleLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 touch-manipulation"
          >
            Гарах
          </button>
        </div>
      </header>

      <div className="flex divide-x divide-zinc-100 rounded-2xl border border-zinc-100 bg-zinc-50/80 py-4 text-center text-sm">
        <div className="flex flex-1 flex-col gap-0.5 px-2">
          <span className="text-lg font-bold text-zinc-900">{saved.length}</span>
          <span className="text-xs text-zinc-500">Хадгалсан</span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-2">
          <span className="text-lg font-bold text-zinc-900">{liked.length}</span>
          <span className="text-xs text-zinc-500">Дуртай</span>
        </div>
      </div>

      <div className="flex border-b border-zinc-200">
        {(["saved", "liked", "nutrition"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 touch-manipulation border-b-2 py-3 text-xs font-semibold sm:text-sm ${
              tab === t
                ? "-mb-px border-(--figma-primary) text-(--figma-primary)"
                : "border-transparent text-zinc-500"
            }`}
          >
            {t === "saved" ? "Хадгалсан" : t === "liked" ? "Дуртай" : "Эрүүл мэнд"}
          </button>
        ))}
      </div>

      {tab === "nutrition" ? (
        <ProfileNutritionAccount />
      ) : loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Ачааллаж байна…</p>
      ) : tab === "saved" ? (
        saved.length ? (
          <RecipeGrid recipes={saved} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">
            Одоогоор хадгалсан жор байхгүй.
          </p>
        )
      ) : liked.length ? (
        <RecipeGrid recipes={liked} />
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">
          Дуртай жор байхгүй.
        </p>
      )}
      {user.role === "admin" ? (
        <Link
          href="/admin"
          className="block rounded-2xl border border-zinc-200 py-3 text-center text-sm font-semibold text-zinc-800 touch-manipulation"
        >
          Админ самбар
        </Link>
      ) : null}
    </main>
  );
}
