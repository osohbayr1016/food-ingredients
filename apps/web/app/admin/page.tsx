import { AiRecipeImportForm } from "@/components/admin/AiRecipeImportForm";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Жор импорт</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Текст эсвэл JSON-оос жор үүсгэж, зураг хавсаргана. Нийтлэхийг идэвхгүй бол
        зочид үзэхгүй.
      </p>
      <div className="mt-6">
        <AiRecipeImportForm />
      </div>
    </main>
  );
}
