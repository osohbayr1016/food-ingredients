import { RecipeEditForm } from "@/components/admin/RecipeEditForm";

export default async function AdminRecipeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Жор засах</h1>
      <p className="mt-1 text-sm text-zinc-600">Өөрчлөлтөө хадгалсны дараа сайт дээр шинэчлэгдэнэ.</p>
      <div className="mt-6">
        <RecipeEditForm recipeId={id} />
      </div>
    </main>
  );
}
