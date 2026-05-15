"use client";

import { BodyStatsForm, DEFAULT_BODY_STATS } from "@/components/profile/BodyStatsForm";
import { NutritionTargetsPanel } from "@/components/profile/NutritionTargetsPanel";
import { readBodyProfile, writeBodyProfile } from "@/lib/bodyProfileStorage";
import { computeTargets, validateBodyStats } from "@/lib/nutritionTargets";
import type { BodyStatsInput } from "@/lib/nutritionTargets";
import { useCallback, useMemo, useState } from "react";

export function ProfileNutritionGuest() {
  const [value, setValue] = useState<BodyStatsInput>(() => {
    if (typeof window === "undefined") return DEFAULT_BODY_STATS;
    return readBodyProfile() ?? DEFAULT_BODY_STATS;
  });
  const [err, setErr] = useState<string | null>(null);

  const targets = useMemo(() => {
    const e = validateBodyStats(value);
    if (e) return null;
    return computeTargets(value);
  }, [value]);

  const save = useCallback(() => {
    const e = validateBodyStats(value);
    if (e) {
      setErr("Утга дутуу эсвэл хязгаараас хэтэрсэн байна.");
      return;
    }
    setErr(null);
    writeBodyProfile(value);
  }, [value]);

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-zinc-900">Биологийн мэдээлэл</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Зочин түвшинд зөвхөн таны төхөөрөмжид хадгалагдана.
        </p>
      </div>
      <NutritionTargetsPanel targets={targets} />
      <BodyStatsForm
        value={value}
        onChange={setValue}
        onSubmit={save}
        submitLabel="Хадгалах"
        error={err}
      />
    </section>
  );
}
