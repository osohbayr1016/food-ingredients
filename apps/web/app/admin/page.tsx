import { JsonRecipeUploadForm } from "@/components/admin/JsonRecipeUploadForm";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Админ удирдлага</h1>
        <p className="mt-2 text-base text-zinc-600">
          Эндээс шинээр жор нэмэх болон бусад тохиргоог хийх боломжтой.
        </p>
      </div>
      
      <div className="mt-8">
        <JsonRecipeUploadForm />
      </div>
    </main>
  );
}
