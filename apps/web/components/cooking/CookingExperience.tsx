"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { restoreCookingSession } from "@/lib/cookingSession";
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
      const session = restoreCookingSession(raw, data.recipe.id, steps.length);
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

  function restartCooking(force = false) {
    if (!force && (timers.length>0 || index>0) && !window.confirm("Ахиц болон таймеруудыг арилгаж шинээр эхлэх үү?")) return;
    try {
      localStorage.removeItem(sessionKey);
      const prefix = `ing_ck_v2:${data.recipe.id}:${serves}:`;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) localStorage.removeItem(key);
      }
    } catch { /* in-memory reset still works */ }
    bootstrap([]);
    vibrated.current.clear();
    setIndex(0);
    setSheet(false);
    setFinish(false);
  }

  const total = steps.length;
  const closeFinish = useCallback(() => setFinish(false),[]);
  useEffect(() => {
    function onKeyboard(event: KeyboardEvent) {
      if(event.ctrlKey||event.altKey||event.metaKey||sheet||finish) return;
      const target=event.target;
      if(target instanceof HTMLElement && (target.isContentEditable ||
         ["INPUT","TEXTAREA","SELECT","BUTTON"].includes(target.tagName))) return;
      if(event.key==="ArrowRight" && index<total-1){
        event.preventDefault();setIndex(i=>Math.min(total-1,i+1));
      }else if(event.key==="ArrowLeft" && index>0){
        event.preventDefault();setIndex(i=>Math.max(0,i-1));
      }
    }
    window.addEventListener("keydown",onKeyboard);
    return ()=>window.removeEventListener("keydown",onKeyboard);
  },[index,total,sheet,finish]);

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
      <button type="button" onClick={() => restartCooking()}
        className="fixed right-4 top-[calc(env(safe-area-inset-top)+12px)] z-50 rounded-full border border-white/25 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-white"
        aria-label="Хоол хийхийг шинээр эхлүүлэх">Шинээр эхлэх</button>
      <CookingSlideDeck
        index={index}
        total={total}
        onIndexChange={setIndex}
        renderSlide={(i) => (
          <CookingStepPanel
            step={steps[i]}
            index={i}
            subs={subs}
            upsert={upsert}
          />
        )}
      />
      <CookingStepControls
        recipeId={data.recipe.id}
        index={index}
        total={total}
        onPrev={() => setIndex((v) => Math.max(0, v - 1))}
        onNext={() => setIndex((v) => Math.min(total - 1, v + 1))}
        onFinish={() => setFinish(true)}
        onIngredients={() => setSheet(true)}
      />
      <TimerBubbleStack
        timers={timers}
        onDismiss={clear}
        label={(t) => remaining(t)===0 ? "Дууссан" : formatMmSs(remaining(t))}
      />
      <IngredientSheet open={sheet} onClose={() => setSheet(false)} items={data.ingredients}
        ctx={ctx} sessionId={`${data.recipe.id}:${serves}`} serves={serves} />
      <CookingFinishDialog
        open={finish}
        recipeId={data.recipe.id}
        onClose={closeFinish}
        onSaved={() => restartCooking(true)}
        onDone={() => restartCooking(true)}
      />
    </div>
  );
}
