import type { BodyStatsInput } from "@/lib/nutritionTargets";
import { validateBodyStats } from "@/lib/nutritionTargets";

const KEY = "food_body_nutrition_v1";

export function readBodyProfile(): BodyStatsInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<BodyStatsInput>;
    const input: BodyStatsInput = {
      sex: p.sex === "female" ? "female" : "male",
      age_years: Number(p.age_years),
      height_cm: Number(p.height_cm),
      weight_kg: Number(p.weight_kg),
      activity_level: p.activity_level as BodyStatsInput["activity_level"],
      goal: p.goal as BodyStatsInput["goal"],
    };
    if (validateBodyStats(input)) return null;
    return input;
  } catch {
    return null;
  }
}

export function writeBodyProfile(b: BodyStatsInput) {
  if (typeof window === "undefined") return;
  if (validateBodyStats(b)) return;
  localStorage.setItem(KEY, JSON.stringify(b));
}

export function clearBodyProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
