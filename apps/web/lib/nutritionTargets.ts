/** Mifflin–St Jeor + activity + goal; keep in sync with apps/api/src/lib/nutritionTargets.ts */

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type NutritionGoal =
  | "maintain"
  | "cut_mild"
  | "cut_mod"
  | "lean_gain"
  | "gain";

export type BodyStatsInput = {
  sex: "male" | "female";
  age_years: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: NutritionGoal;
};

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  target_kcal: number;
  protein_g_low: number;
  protein_g_high: number;
};

const ACTIVITY: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_KCAL_DELTA: Record<NutritionGoal, number> = {
  maintain: 0,
  cut_mild: -250,
  cut_mod: -500,
  lean_gain: 250,
  gain: 500,
};

const GOAL_PROTEIN_PER_KG: Record<NutritionGoal, [number, number]> = {
  maintain: [1.2, 1.6],
  cut_mild: [1.6, 2.0],
  cut_mod: [1.8, 2.2],
  lean_gain: [1.6, 2.0],
  gain: [1.6, 2.2],
};

export function validateBodyStats(b: BodyStatsInput): string | null {
  if (b.sex !== "male" && b.sex !== "female") return "invalid_sex";
  if (!Number.isFinite(b.age_years) || b.age_years < 14 || b.age_years > 100)
    return "invalid_age";
  if (!Number.isFinite(b.height_cm) || b.height_cm < 100 || b.height_cm > 250)
    return "invalid_height";
  if (!Number.isFinite(b.weight_kg) || b.weight_kg < 30 || b.weight_kg > 300)
    return "invalid_weight";
  if (!Object.prototype.hasOwnProperty.call(ACTIVITY, b.activity_level))
    return "invalid_activity";
  if (!Object.prototype.hasOwnProperty.call(GOAL_KCAL_DELTA, b.goal))
    return "invalid_goal";
  return null;
}

function roundKcal(n: number) {
  return Math.round(n);
}

export function computeTargets(input: BodyStatsInput): NutritionTargets {
  const w = input.weight_kg;
  const h = input.height_cm;
  const a = input.age_years;
  const base =
    input.sex === "male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
  const bmr = roundKcal(base);
  const mult = ACTIVITY[input.activity_level];
  const tdee = roundKcal(base * mult);
  const target_kcal = Math.max(800, roundKcal(tdee + GOAL_KCAL_DELTA[input.goal]));
  const [pl, ph] = GOAL_PROTEIN_PER_KG[input.goal];
  const protein_g_low = Math.round(w * pl);
  const protein_g_high = Math.round(w * ph);
  return { bmr, tdee, target_kcal, protein_g_low, protein_g_high };
}
