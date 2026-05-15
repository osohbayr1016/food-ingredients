import type { BodyStatsInput } from "./nutritionTargets";

export type NutritionProfileRow = {
  user_id: string;
  sex: "male" | "female";
  age_years: number;
  height_cm: number;
  weight_kg: number;
  activity_level: BodyStatsInput["activity_level"];
  goal: BodyStatsInput["goal"];
  updated_at: string;
};

export function rowToInput(r: NutritionProfileRow): BodyStatsInput {
  return {
    sex: r.sex,
    age_years: r.age_years,
    height_cm: r.height_cm,
    weight_kg: r.weight_kg,
    activity_level: r.activity_level,
    goal: r.goal,
  };
}
