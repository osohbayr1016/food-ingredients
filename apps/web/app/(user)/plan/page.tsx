import { MealPlanner } from "@/components/planner/MealPlanner";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeListItem } from "@/lib/types";

export default async function MealPlanPage() {
  const data = await serverGetJson<{ recipes: RecipeListItem[] }>("/recipes?page_size=100");
  return <MealPlanner recipes={data.recipes ?? []} />;
}
