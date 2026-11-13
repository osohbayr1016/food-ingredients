import { CookingExperience } from "@/components/cooking/CookingExperience";
import { ApiHttpError, serverGetJson } from "@/lib/serverFetch";
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
    const serves = typeof servesParam === "number" && Number.isSafeInteger(servesParam)
      && servesParam >= 1 && servesParam <= 30
      ? servesParam : Math.max(1, Math.min(30, Number(detail.recipe.serves) || 1));
    return <CookingExperience data={detail} serves={serves} />;
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) notFound();
    throw error;
  }
}
