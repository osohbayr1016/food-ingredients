"use client";

import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { RecipeListItem } from "@/lib/types";

export function RecipeGrid({ recipes }: { recipes: RecipeListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
