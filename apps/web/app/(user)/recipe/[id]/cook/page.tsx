import { CookingExperience } from "@/components/cooking/CookingExperience";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeDetail } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function CookPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const raw = sp?.serves;
  const servesParam = typeof raw === "string" ? Number(raw) : undefined;
  try {
    const detail = await serverGetJson<RecipeDetail>(`/recipes/${id}`);
    const serves = servesParam && !Number.isNaN(servesParam)
      ? Math.max(1, servesParam)
      : Math.max(1, Number(detail.recipe.serves) || 1);
    return <CookingExperience data={detail} serves={serves} />;
  } catch {
    notFound();
  }
}
