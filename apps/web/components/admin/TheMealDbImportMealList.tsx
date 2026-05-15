import type { MealSearchRow } from "@/lib/theMealDbAdminFetch";

type Props = {
  meals: MealSearchRow[];
  pickedId: string | null;
  onPick: (m: MealSearchRow) => void;
};

export function TheMealDbImportMealList({ meals, pickedId, onPick }: Props) {
  if (!meals.length) return null;
  return (
    <ul className="max-h-48 space-y-1 overflow-auto text-sm">
      {meals.map((m) => (
        <li key={m.idMeal}>
          <button
            type="button"
            onClick={() => onPick(m)}
            className={`w-full rounded-lg px-2 py-1.5 text-left ${
              pickedId === m.idMeal ? "bg-red-50 text-red-900" : "hover:bg-zinc-50"
            }`}
          >
            {m.strMeal}
          </button>
        </li>
      ))}
    </ul>
  );
}
