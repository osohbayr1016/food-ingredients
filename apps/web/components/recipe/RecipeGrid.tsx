"use client";

import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { RecipeListItem } from "@/lib/types";

export function RecipeGrid({ recipes }: { recipes: RecipeListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} />
      ))}
    </div>
  );
}
