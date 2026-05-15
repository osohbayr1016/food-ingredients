"use client";

import type {
  ActivityLevel,
  BodyStatsInput,
  NutritionGoal,
} from "@/lib/nutritionTargets";

export const DEFAULT_BODY_STATS: BodyStatsInput = {
  sex: "male",
  age_years: 30,
  height_cm: 170,
  weight_kg: 70,
  activity_level: "moderate",
  goal: "maintain",
};

const ACTIVITY_OPTS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Ихэвчлэн суудаг" },
  { value: "light", label: "Хөнгөн идэвхтэй" },
  { value: "moderate", label: "Дунд идэвхтэй" },
  { value: "active", label: "Идэвхтэй" },
  { value: "very_active", label: "Маш идэвхтэй" },
];

const GOAL_OPTS: { value: NutritionGoal; label: string }[] = [
  { value: "maintain", label: "Жингээ хадгалах" },
  { value: "cut_mild", label: "Жингээ бага зэрэг бууруулах" },
  { value: "cut_mod", label: "Жингээ бууруулах" },
  { value: "lean_gain", label: "Өсөх (туранхай)" },
  { value: "gain", label: "Өөдгүй өсөлт" },
];

export function BodyStatsForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  busy,
  error,
}: {
  value: BodyStatsInput;
  onChange: (next: BodyStatsInput) => void;
  onSubmit: () => void;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
}) {
  function patch<K extends keyof BodyStatsInput>(k: K, v: BodyStatsInput[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">Хүйс</span>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
            value={value.sex}
            onChange={(e) =>
              patch("sex", e.target.value === "female" ? "female" : "male")
            }
          >
            <option value="male">Эрэгтэй</option>
            <option value="female">Эмэгтэй</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">Нас (14–100)</span>
          <input
            type="number"
            min={14}
            max={100}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
            value={value.age_years}
            onChange={(e) => patch("age_years", Number(e.target.value))}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">Өндөр (см)</span>
          <input
            type="number"
            min={100}
            max={250}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
            value={value.height_cm}
            onChange={(e) => patch("height_cm", Number(e.target.value))}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">Жин (кг)</span>
          <input
            type="number"
            min={30}
            max={300}
            step={0.1}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
            value={value.weight_kg}
            onChange={(e) => patch("weight_kg", Number(e.target.value))}
          />
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-800">Хөдөлгөөний түвшин</span>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
            value={value.activity_level}
            onChange={(e) =>
              patch("activity_level", e.target.value as ActivityLevel)
            }
          >
            {ACTIVITY_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-800">Зорилго</span>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
            value={value.goal}
            onChange={(e) => patch("goal", e.target.value as NutritionGoal)}
          >
            {GOAL_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-(--figma-primary) py-3 text-sm font-semibold text-white disabled:opacity-60 touch-manipulation"
      >
        {busy ? "Түр хүлээнэ үү…" : submitLabel}
      </button>
    </form>
  );
}
