"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CookingFinishDialog } from "@/components/cooking/CookingFinishDialog";
import { CookingProgress } from "@/components/cooking/CookingProgress";
import { CookingSlideDeck } from "@/components/cooking/CookingSlideDeck";
import { CookingStepControls } from "@/components/cooking/CookingStepControls";
import { IngredientSheet } from "@/components/cooking/IngredientSheet";
import { TimerBubbleStack } from "@/components/cooking/TimerBubble";
import { useBubbleTimers } from "@/hooks/useBubbleTimers";
import { useWakeLock } from "@/hooks/useWakeLock";
import { buildSubstitutionMap, type ScaleCtx } from "@/lib/ingredientScale";
import { CookingStepPanel } from "@/components/cooking/CookingStepPanel";
import type { RecipeDetail } from "@/lib/types";

const LEGACY_STORAGE = "food_ingredients_cook_v1";

function restoreSession(raw: string | null, recipeId: string, stepCount: number) {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as {
      recipeId?: unknown; step?: unknown; timers?: unknown;
    };
    if (session.recipeId !== recipeId) return null;
    const step = typeof session.step === "number" && Number.isSafeInteger(session.step)
      ? Math.min(Math.max(session.step, 0), Math.max(stepCount - 1, 0)) : 0;
    const timers = Array.isArray(session.timers)
      ? session.timers.slice(0, 20).filter((t): t is { id: string; label: string; endsAt: number } =>
          t && typeof t.id === "string" && typeof t.label === "string" &&
          t.id.length < 120 && t.label.length < 120 &&
          typeof t.endsAt === "number" && Number.isFinite(t.endsAt) &&
          t.endsAt > Date.now() - 60_000)
      : [];
    return { step, timers };
  } catch { return null; }
}

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
  const sessionKey = `food_ingredients_cook_v2:${data.recipe.id}:${serves}`;
  const [restoredKey, setRestoredKey] = useState<string | null>(null);
  const vibrated = useRef(new Set<string>());
  const { timers, upsert, clear, bootstrap, remaining, formatMmSs, pulse } =
    useBubbleTimers();

  useWakeLock(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(sessionKey) ??
        localStorage.getItem(LEGACY_STORAGE);
      const session = restoreSession(raw, data.recipe.id, steps.length);
      setIndex(session?.step ?? 0);
      bootstrap(session?.timers ?? []);
    } catch {
      setIndex(0);
      bootstrap([]);
    } finally {
      setRestoredKey(sessionKey);
    }
  }, [bootstrap, data.recipe.id, sessionKey, steps.length]);

  useEffect(() => {
    if (restoredKey !== sessionKey) return;
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(sessionKey,
          JSON.stringify({ recipeId: data.recipe.id, step: index, timers }));
      } catch { /* private browsing or quota: cooking still works in-memory */ }
    }, 200);
    return () => window.clearTimeout(handle);
  }, [restoredKey, sessionKey, data.recipe.id, index, timers]);

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
        replace
        href={`/recipe/${data.recipe.id}`}
        className="fixed top-[calc(env(safe-area-inset-top)+12px)] left-4 z-50 rounded-full border border-zinc-200 bg-white/95 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-md touch-manipulation active:bg-white"
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
      <CookingStepControls
        recipeId={data.recipe.id}
        index={index}
        total={total}
        onPrev={() => setIndex((v) => Math.max(0, v - 1))}
        onNext={() => setIndex((v) => Math.min(total - 1, v + 1))}
        onIngredients={() => setSheet(true)}
      />
      <TimerBubbleStack
        timers={timers}
        onDismiss={clear}
        label={(t) => formatMmSs(remaining(t))}
      />
      <IngredientSheet open={sheet} onClose={() => setSheet(false)} items={data.ingredients}
        ctx={ctx} sessionId={`${data.recipe.id}:${serves}`} serves={serves} />
      <CookingFinishDialog
        open={finish}
        recipeId={data.recipe.id}
        onClose={() => setFinish(false)}
      />
    </div>
  );
}
