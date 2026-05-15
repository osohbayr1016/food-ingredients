"use client";

import Link from "next/link";
import { RecipeLikeButton } from "@/components/recipe/RecipeLikeButton";
import { RecipeSaveHeart } from "@/components/recipe/RecipeSaveHeart";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { recipeImageUrl } from "@/lib/imageUrl";
import type { RecipeListItem } from "@/lib/types";

export function DifficultyDots({ value }: { value: number }) {
  const accent = "#E23E3E";
  const muted = "#D1D5DB";
  const dots = [1, 2, 3].map((i) => (
    <span key={i} style={{ color: i <= value ? accent : muted }}>
      ●
    </span>
  ));
  return <span className="tracking-tight">{dots}</span>;
}

export function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const src = recipeImageUrl(recipe.image_r2_key);

  return (
    <article className="relative aspect-3/4 overflow-hidden rounded-3xl bg-zinc-100 shadow-md">
      <Link
        href={`/recipe/${recipe.id}`}
        className="absolute inset-0 z-0 block touch-manipulation active:brightness-95"
        aria-labelledby={`recipe-title-${recipe.id}`}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-zinc-200 text-4xl opacity-60">
            {cuisineEmoji(recipe.cuisine)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-black/88 via-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 pt-8">
          <h2
            id={`recipe-title-${recipe.id}`}
            className="line-clamp-2 text-base font-bold leading-snug text-white"
          >
            {recipe.title}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-zinc-800 shadow-sm"
              aria-hidden
            >
              {recipe.cuisine.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate text-sm font-medium text-white/95">{recipe.cuisine}</span>
          </div>
        </div>
      </Link>
      <div className="absolute left-2 top-2 z-10">
        <RecipeLikeButton recipeId={recipe.id} variant="card" />
      </div>
      <div className="absolute right-2 top-2 z-10">
        <RecipeSaveHeart recipeId={recipe.id} variant="card" />
      </div>
    </article>
  );
}
