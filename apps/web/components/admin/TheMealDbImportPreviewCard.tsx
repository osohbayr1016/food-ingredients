import Link from "next/link";
import type { RecipePatchPayload } from "@/lib/adminRecipeTypes";
import type { TheMealDbDedupe } from "@/lib/theMealDbAdminFetch";

type Props = {
  patch: RecipePatchPayload;
  dedupe: TheMealDbDedupe | null;
  busy: boolean;
  onDraft: () => void;
  onPublish: () => void;
};

export function TheMealDbImportPreviewCard({
  patch,
  dedupe,
  busy,
  onDraft,
  onPublish,
}: Props) {
  const blocked = dedupe?.conflict === "external";
  return (
    <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-800">
      <p>
        <span className="font-medium">{patch.recipe.title}</span> · орц{" "}
        {patch.ingredients.length} · алхам {patch.steps.length}
      </p>
      {dedupe?.dedupe_unavailable ? (
        <p className="text-amber-800">
          Давхцлын шалгалт ажиллуулаагүй (өгөгдлийн санг шалгана уу). Импорт хийх боломжтой.
        </p>
      ) : null}
      {dedupe?.conflict === "external" && dedupe.existing_recipe_id ? (
        <p className="text-amber-800">
          Ижил TheMealDB ID:{" "}
          <Link
            href={`/recipe/${dedupe.existing_recipe_id}`}
            className="font-medium underline"
          >
            одоогийн жор
          </Link>
        </p>
      ) : null}
      {dedupe?.title_matches?.length ? (
        <p className="text-amber-800">
          Төстэй гарчигтай жор олдсон: {dedupe.title_matches.map((t) => t.id).join(", ")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={busy || blocked}
          onClick={onDraft}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
        >
          Ноорогоор нэмэх
        </button>
        <button
          type="button"
          disabled={busy || blocked}
          onClick={onPublish}
          className="rounded-xl bg-[#E23E3E] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Нийтлэх
        </button>
      </div>
    </div>
  );
}
