"use client";

import { BodyStatsForm, DEFAULT_BODY_STATS } from "@/components/profile/BodyStatsForm";
import { NutritionTargetsPanel } from "@/components/profile/NutritionTargetsPanel";
import { clientFetch } from "@/lib/clientApi";
import {
  computeTargets,
  validateBodyStats,
  type BodyStatsInput,
  type NutritionTargets,
} from "@/lib/nutritionTargets";
import { useCallback, useEffect, useState } from "react";

type ApiProfile = {
  sex: BodyStatsInput["sex"];
  age_years: number;
  height_cm: number;
  weight_kg: number;
  activity_level: BodyStatsInput["activity_level"];
  goal: BodyStatsInput["goal"];
  updated_at: string;
};

export function ProfileNutritionAccount() {
  const [value, setValue] = useState<BodyStatsInput>(DEFAULT_BODY_STATS);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await clientFetch("/me/nutrition");
      const data = (await res.json()) as {
        profile: ApiProfile | null;
        targets: NutritionTargets | null;
      };
      if (!res.ok) {
        setErr("Татахад алдаа гарлаа.");
        return;
      }
      if (data.profile) {
        const v: BodyStatsInput = {
          sex: data.profile.sex,
          age_years: data.profile.age_years,
          height_cm: data.profile.height_cm,
          weight_kg: data.profile.weight_kg,
          activity_level: data.profile.activity_level,
          goal: data.profile.goal,
        };
        setValue(v);
        setTargets(data.targets ?? computeTargets(v));
      } else {
        setValue(DEFAULT_BODY_STATS);
        setTargets(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    if (validateBodyStats(value)) {
      setErr("Утга дутуу эсвэл хязгаараас хэтэрсэн байна.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await clientFetch("/me/nutrition", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const data = (await res.json()) as {
        error?: string;
        targets?: NutritionTargets;
      };
      if (!res.ok) {
        setErr(data.error === "unauthorized" ? "Нэвтэрнэ үү." : "Хадгалахад алдаа.");
        return;
      }
      if (data.targets) setTargets(data.targets);
    } finally {
      setBusy(false);
    }
  }, [value]);

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">Ачааллаж байна…</p>
    );
  }

  return (
    <section className="space-y-4">
      <NutritionTargetsPanel targets={targets} />
      <BodyStatsForm
        value={value}
        onChange={(v) => {
          setValue(v);
          if (!validateBodyStats(v)) setTargets(computeTargets(v));
          else setTargets(null);
        }}
        onSubmit={() => void save()}
        submitLabel="Серверт хадгалах"
        busy={busy}
        error={err}
      />
    </section>
  );
}
