import { RecipeDetailView } from "@/components/recipe/RecipeDetailView";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeDetail } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function RecipePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const detail = await serverGetJson<RecipeDetail>(`/recipes/${id}`);
    return <RecipeDetailView data={detail} />;
  } catch {
    notFound();
  }
}
