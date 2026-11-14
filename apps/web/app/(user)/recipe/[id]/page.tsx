import { RecipeDetailView } from "@/components/recipe/RecipeDetailView";
import { ApiHttpError, serverGetJson } from "@/lib/serverFetch";
import { recipeHeroSlideUrls } from "@/lib/recipeGallery";
import { hasVerifiedNutrition } from "@/lib/recipeNutritionEvidence";
import type { RecipeDetail } from "@/lib/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Props = { params: Promise<{ id: string }> };
const getDetail = cache((id: string) =>
  serverGetJson<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { recipe } = await getDetail(id);
    const image = recipeHeroSlideUrls(recipe.image_r2_key,recipe.gallery_r2_keys)[0];
    const description = recipe.description.slice(0,180);
    return {
      title: recipe.title,
      description,
      openGraph: {
        type: "article",
        title: recipe.title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: "Жор олдсонгүй" };
  }
}

function structuredRecipe(detail: RecipeDetail) {
  const { recipe, ingredients, steps, metadata } = detail;
  const image = recipeHeroSlideUrls(recipe.image_r2_key,recipe.gallery_r2_keys)[0];
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://food-ingredients-web.osohoo691016.workers.dev";
  const imageUrl = image ? new URL(image, site).toString() : undefined;
  const nutrition = hasVerifiedNutrition(metadata) ? {
    "@type": "NutritionInformation",
    calories: metadata.calories_kcal != null ? `${metadata.calories_kcal} calories` : undefined,
    proteinContent: metadata.protein_g != null ? `${metadata.protein_g} g` : undefined,
    carbohydrateContent: metadata.carbs_g != null ? `${metadata.carbs_g} g` : undefined,
    fatContent: metadata.fat_g != null ? `${metadata.fat_g} g` : undefined,
  } : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: imageUrl ? [imageUrl] : undefined,
    recipeCuisine: recipe.cuisine,
    recipeYield: `${recipe.serves} порц`,
    prepTime: recipe.prep_time > 0 ? `PT${recipe.prep_time}M` : undefined,
    cookTime: recipe.cook_time > 0 ? `PT${recipe.cook_time}M` : undefined,
    recipeIngredient: ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`.trim()),
    recipeInstructions: steps.map((step,i) => ({
      "@type":"HowToStep", position:i+1, text:step.description,
    })),
    nutrition,
  };
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params;
  try {
    const detail = await getDetail(id);
    const json = JSON.stringify(structuredRecipe(detail)).replace(/</g, "\\u003c");
    return <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      <RecipeDetailView data={detail} />
    </>;
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) notFound();
    throw error;
  }
}
