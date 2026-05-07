"use client";

import { useRouter } from "next/navigation";
import { RecipeLikeButton } from "@/components/recipe/RecipeLikeButton";
import { RecipeSaveHeart } from "@/components/recipe/RecipeSaveHeart";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
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

export function RecipeDetailHero({
  data,
  hero,
}: {
  data: RecipeDetail;
  hero: string | null | undefined;
}) {
  const router = useRouter();

  return (
    <section className="relative -mx-4 aspect-5/6 overflow-hidden rounded-b-[28px] bg-zinc-200 sm:mx-0 sm:rounded-3xl">
      {hero ? (
        <img
          src={hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-6xl opacity-40">
          {cuisineEmoji(data.recipe.cuisine)}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/40" />
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
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        <span className="h-1.5 w-6 rounded-full bg-white" aria-hidden />
        <span className="h-1.5 w-1.5 rounded-full bg-white/50" aria-hidden />
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" aria-hidden />
      </div>
    </section>
  );
}
