"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HeroImageCarousel } from "@/components/recipe/HeroImageCarousel";
import { RecipeLikeButton } from "@/components/recipe/RecipeLikeButton";
import { RecipeSaveHeart } from "@/components/recipe/RecipeSaveHeart";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { recipeHeroSlideUrls } from "@/lib/recipeGallery";
import type { RecipeDetail } from "@/lib/types";

function ShareRow({ title }: { title: string }) {
  async function share() {
    const url =
      typeof window !== "undefined"
        ? window.location.href.split("#")[0] ?? ""
        : "";
    try {
      await navigator.share?.({ title, url });
    } catch {
      await navigator.clipboard?.writeText(url);
    }
  }
  return (
    <button
      type="button"
      aria-label="Share recipe"
      onClick={() => share()}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm touch-manipulation"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M16 6l-4-4-4 4M12 2v13"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function RecipeDetailHero({ data }: { data: RecipeDetail }) {
  const router = useRouter();
  const slides = useMemo(
    () => recipeHeroSlideUrls(data.recipe.image_r2_key, data.recipe.gallery_r2_keys),
    [data.recipe.image_r2_key, data.recipe.gallery_r2_keys],
  );

  const [heroIdx, setHeroIdx] = useState(0);

  return (
    <section
      className="relative -mx-4 aspect-5/6 sm:mx-0"
      aria-roledescription="carousel"
    >
      <div className="absolute inset-0 overflow-hidden rounded-b-[28px] bg-zinc-200 sm:rounded-3xl">
        {slides.length > 0 ? (
          <HeroImageCarousel
            key={slides.join("|")}
            slides={slides}
            onIndexChange={setHeroIdx}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-6xl opacity-40">
            {cuisineEmoji(data.recipe.cuisine)}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-b-[28px] bg-linear-to-t from-black/75 via-black/20 to-black/40 sm:rounded-3xl" />
      <div
        className="absolute left-3 top-[calc(env(safe-area-inset-top)+8px)] z-10 flex w-[calc(100%-24px)] items-center justify-between gap-2"
        style={{ pointerEvents: "auto" }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md touch-manipulation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <ShareRow title={data.recipe.title} />
          <RecipeLikeButton recipeId={data.recipe.id} variant="hero" />
          <RecipeSaveHeart recipeId={data.recipe.id} variant="hero" />
        </div>
      </div>
      {slides.length > 0 && (
        <div
          className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center gap-2"
          aria-hidden
        >
          {slides.map((_, i) => (
            <span
              key={i}
              className={
                i === heroIdx
                  ? "h-1.5 w-6 rounded-full bg-white transition-all duration-300"
                  : "h-1.5 w-1.5 rounded-full bg-white/45 transition-all duration-300"
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
