"use client";

import Link from "next/link";
import { RecipeDetailStatRow } from "@/components/recipe/RecipeDetailBlocks";
import { RecipeDetailHero } from "@/components/recipe/RecipeDetailHero";
import { DifficultyDots } from "@/components/recipe/RecipeCard";
import { IngredientGroupedList } from "@/components/recipe/IngredientGroupedList";
import { ServingSlider } from "@/components/recipe/ServingSlider";
import { StepPreviewCard } from "@/components/recipe/StepPreviewCard";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { interpolateStep } from "@/lib/interpolateStep";
import { buildSubstitutionMap, type ScaleCtx } from "@/lib/ingredientScale";
import { recipeImageUrl } from "@/lib/imageUrl";
import type { RecipeDetail } from "@/lib/types";
import { useMemo, useState } from "react";

export function RecipeDetailView({ data }: { data: RecipeDetail }) {
  const base = Math.max(1, Number(data.recipe.serves) || 1);
  const [serves, setServes] = useState(base);
  const ctx: ScaleCtx = useMemo(
    () => ({ factor: serves / base }),
    [serves, base],
  );
  const substitutions = useMemo(
    () => buildSubstitutionMap(data.ingredients, ctx),
    [data.ingredients, ctx],
  );

  const hero = recipeImageUrl(data.recipe.image_r2_key);

  return (
    <main className="space-y-6 pb-32">
      <RecipeDetailHero data={data} hero={hero} />

      <header>
        <h1 className="text-2xl font-bold leading-tight text-zinc-900">
          {data.recipe.title}
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-zinc-700">
        {data.recipe.description}
      </p>

      <RecipeDetailStatRow
        prepTime={data.recipe.prep_time}
        cookTime={data.recipe.cook_time}
        serves={serves}
        origin={data.recipe.cuisine}
      />

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>Prep {data.recipe.prep_time} min</span>
        <span aria-hidden>•</span>
        <span>Cook {data.recipe.cook_time} min</span>
        <DifficultyDots value={data.recipe.difficulty} />
        <span className="inline-flex items-center gap-1" aria-hidden>
          {cuisineEmoji(data.recipe.cuisine)}
        </span>
      </div>

      {!!data.tags.length && (
        <div className="flex flex-wrap gap-2 text-xs">
          {data.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-700"
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {data.recipe.tips && (
        <div className="space-y-2">
          {data.recipe.tips
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((chunk, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-rose-100 bg-(--figma-soft) px-4 py-3 text-sm text-zinc-800"
              >
                {chunk}
              </div>
            ))}
        </div>
      )}

      <ServingSlider
        value={serves}
        max={Math.max(12, base * 4)}
        onChange={setServes}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900">Ingredients</h2>
        <IngredientGroupedList items={data.ingredients} ctx={ctx} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900">Instructions</h2>
        <div className="space-y-3">
          {data.steps.map((st) => {
            const tpl = st.description_template?.trim();
            const body = tpl
              ? interpolateStep(tpl, substitutions)
              : st.description;
            return (
              <StepPreviewCard key={st.id} order={st.step_order} text={body} />
            );
          })}
        </div>
      </section>

      <Link
        href={`/recipe/${data.recipe.id}/cook?serves=${serves}`}
        className="fixed left-1/2 z-30 inline-flex min-w-[220px] -translate-x-1/2 justify-center rounded-full px-6 py-3 text-base font-semibold text-white shadow-lg shadow-rose-300/50 touch-manipulation"
        style={{
          bottom: "calc(88px + env(safe-area-inset-bottom))",
          backgroundColor: "var(--figma-primary)",
        }}
      >
        Start cooking
      </Link>
    </main>
  );
}
