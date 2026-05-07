"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CookingFinishDialog } from "@/components/cooking/CookingFinishDialog";
import { CookingProgress } from "@/components/cooking/CookingProgress";
import { CookingSlideDeck } from "@/components/cooking/CookingSlideDeck";
import { IngredientSheet } from "@/components/cooking/IngredientSheet";
import { TimerBubbleStack } from "@/components/cooking/TimerBubble";
import { useBubbleTimers } from "@/hooks/useBubbleTimers";
import { useWakeLock } from "@/hooks/useWakeLock";
import { buildSubstitutionMap, type ScaleCtx } from "@/lib/ingredientScale";
import { CookingStepPanel } from "@/components/cooking/CookingStepPanel";
import type { RecipeDetail } from "@/lib/types";

const STORAGE = "food_ingredients_cook_v1";

export function CookingExperience({
  data,
  serves,
}: {
  data: RecipeDetail;
  serves: number;
}) {
  const base = Math.max(1, Number(data.recipe.serves) || 1);
  const ctx: ScaleCtx = useMemo(
    () => ({ factor: Math.max(0.25, serves) / base }),
    [serves, base],
  );
  const subs = useMemo(
    () => buildSubstitutionMap(data.ingredients, ctx),
    [data.ingredients, ctx],
  );
  const steps = data.steps;
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [finish, setFinish] = useState(false);
  const vibrated = useRef(new Set<string>());
  const { timers, upsert, clear, bootstrap, remaining, formatMmSs, pulse } =
    useBubbleTimers();

  useWakeLock(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        recipeId: string;
        step: number;
        timers: { id: string; label: string; endsAt: number }[];
      };
      if (parsed.recipeId !== data.recipe.id) return;
      setIndex(Math.min(parsed.step, steps.length - 1));
      bootstrap(parsed.timers ?? []);
    } catch {
      /* ignore */
    }
  }, [bootstrap, data.recipe.id, steps.length]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ recipeId: data.recipe.id, step: index, timers }),
      );
    }, 200);
    return () => window.clearTimeout(handle);
  }, [data.recipe.id, index, timers]);

  useEffect(() => {
    timers.forEach((timer) => {
      if (remaining(timer) === 0 && !vibrated.current.has(timer.id)) {
        vibrated.current.add(timer.id);
        navigator.vibrate?.([100, 50, 100]);
      }
    });
  }, [pulse, remaining, timers]);

  const total = steps.length;

  return (
    <div className="relative min-h-dvh bg-zinc-950 text-zinc-50">
      <CookingProgress index={index} total={total} />
      <Link
        href={`/recipe/${data.recipe.id}`}
        className="fixed top-[calc(env(safe-area-inset-top)+12px)] left-4 z-50 rounded-full border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm touch-manipulation"
      >
        ← Буцах
      </Link>
      <CookingSlideDeck
        index={index}
        total={total}
        onIndexChange={setIndex}
        renderSlide={(i) => (
          <CookingStepPanel
            step={steps[i]}
            index={i}
            total={total}
            subs={subs}
            upsert={upsert}
            onFinish={() => setFinish(true)}
          />
        )}
      />
      <button
        type="button"
        className="fixed left-2 top-1/2 -translate-y-1/2 h-32 w-12 z-30 touch-manipulation"
        aria-label="Өмнөх"
        onClick={() => setIndex((v) => Math.max(0, v - 1))}
      />
      <button
        type="button"
        className="fixed right-2 top-1/2 -translate-y-1/2 h-32 w-12 z-30 touch-manipulation"
        aria-label="Дараах"
        onClick={() => setIndex((v) => Math.min(total - 1, v + 1))}
      />
      <button
        type="button"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+96px)] left-1/2 -translate-x-1/2 rounded-full border border-white/20 px-4 py-2 text-xs touch-manipulation z-30"
        onClick={() => setSheet(true)}
      >
        Орцнууд
      </button>
      <TimerBubbleStack
        timers={timers}
        onDismiss={clear}
        label={(t) => formatMmSs(remaining(t))}
      />
      <IngredientSheet open={sheet} onClose={() => setSheet(false)} items={data.ingredients} />
      <CookingFinishDialog
        open={finish}
        recipeId={data.recipe.id}
        onClose={() => setFinish(false)}
      />
    </div>
  );
}
