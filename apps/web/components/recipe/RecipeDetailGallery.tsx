"use client";

import { galleryImageUrls } from "@/lib/recipeGallery";

type Props = { galleryRaw: string | null | undefined };

export function RecipeDetailGallery({ galleryRaw }: Props) {
  const urls = galleryImageUrls(galleryRaw).filter(
    (u): u is string => typeof u === "string" && u.length > 0,
  );
  if (!urls.length) return null;
  return (
    <section className="space-y-2" aria-label="More photos">
      <h2 className="text-lg font-bold text-zinc-900">Photos</h2>
      <div className="grid grid-cols-2 gap-2">
        {urls.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            className="aspect-square w-full rounded-2xl border border-zinc-100 object-cover"
          />
        ))}
      </div>
    </section>
  );
}
