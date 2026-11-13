"use client";

import Link from "next/link";
import { RecipeSaveHeart } from "@/components/recipe/RecipeSaveHeart";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { recipeImageUrl } from "@/lib/imageUrl";
import type { RecipeListItem } from "@/lib/types";

export function DifficultyDots({ value }: { value: number }) {
  return <span aria-label={`Хүндрэлийн түвшин ${value}/3`} className="tracking-tight text-[#4a8054]">{"●".repeat(Math.max(0, Math.min(3, value)))}<span className="text-zinc-300">{"●".repeat(Math.max(0, 3 - value))}</span></span>;
}

export function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const src = recipeImageUrl(recipe.image_r2_key);
  const minutes = Math.max(0, recipe.prep_time) + Math.max(0, recipe.cook_time);
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[22px] border border-[#e7ece5] bg-white shadow-[0_2px_14px_rgba(28,55,31,0.05)] transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/recipe/${recipe.id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a8054]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e6eee0]">
          {src ? (
            <img src={src} alt={recipe.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          ) : (
            <div className="grid h-full place-items-center text-6xl" aria-hidden>{cuisineEmoji(recipe.cuisine)}</div>
          )}
          {minutes > 0 && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#244332]">{minutes} мин</span>}
        </div>
        <div className="space-y-2 px-4 pb-4 pt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#5b8b62]">{recipe.cuisine}</p>
          <h3 className="line-clamp-2 min-h-11 text-base font-bold leading-snug text-[#21362b]">{recipe.title}</h3>
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span>{recipe.serves} порц</span>
            <span>Түвшин {recipe.difficulty}/3</span>
          </div>
        </div>
      </Link>
      <div className="absolute right-2 top-2 z-10 rounded-full bg-white/90 shadow-sm">
        <RecipeSaveHeart recipeId={recipe.id} variant="card" />
      </div>
    </article>
  );
}
