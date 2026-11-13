"use client";

import Link from "next/link";
import { RecipeDetailStatRow } from "@/components/recipe/RecipeDetailBlocks";
import { RecipeDetailHero } from "@/components/recipe/RecipeDetailHero";
import { RecipeDetailGallery } from "@/components/recipe/RecipeDetailGallery";
import { DifficultyDots } from "@/components/recipe/RecipeCard";
import { IngredientGroupedList } from "@/components/recipe/IngredientGroupedList";
import { ServingSlider } from "@/components/recipe/ServingSlider";
import { StepPreviewCard } from "@/components/recipe/StepPreviewCard";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { interpolateStep } from "@/lib/interpolateStep";
import { buildSubstitutionMap, type ScaleCtx } from "@/lib/ingredientScale";
import type { RecipeDetail } from "@/lib/types";
import { ALLERGEN_OPTIONS, embedVideoUrl } from "@/lib/recipeMetadata";
import { useMemo, useState } from "react";

export function RecipeDetailView({ data }: { data: RecipeDetail }) {
  const meta = data.metadata;
  const reviewed = meta?.review_status === "approved";
  const videoEmbed = reviewed ? embedVideoUrl(meta?.video_url) : null;
  const nutritionAvailable = Boolean(reviewed && meta?.nutrition_source && [meta?.calories_kcal, meta?.protein_g, meta?.carbs_g, meta?.fat_g].some(v => v != null));
  const allergens = (meta?.allergens ?? []).map(code => ALLERGEN_OPTIONS.find(([id]) => id === code)?.[1] ?? code);
  const base = Math.max(1, Number(data.recipe.serves) || 1);
  const [serves, setServes] = useState(base);
  const ctx: ScaleCtx = useMemo(
    () => ({ factor: serves / base }),
    [serves, base],
  );
  const substitutions = useMemo(
    () => buildSubstitutionMap(data.ingredients, ctx),
    [data.ingredients, ctx],
  );

  return (
    <main className="space-y-6 pb-32">
      <RecipeDetailHero data={data} />

      <header>
        <h1 className="text-2xl font-bold leading-tight text-zinc-900">
          {data.recipe.title}
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-zinc-700">
        {data.recipe.description}
      </p>

      <RecipeDetailStatRow
        prepTime={data.recipe.prep_time}
        cookTime={data.recipe.cook_time}
        serves={serves}
        origin={data.recipe.cuisine}
      />

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        {data.recipe.prep_time > 0 && <span>Бэлтгэл {data.recipe.prep_time} мин</span>}
        {data.recipe.prep_time > 0 && data.recipe.cook_time > 0 && <span aria-hidden>•</span>}
        {data.recipe.cook_time > 0 && <span>Хийх {data.recipe.cook_time} мин</span>}
        <DifficultyDots value={data.recipe.difficulty} />
        <span className="inline-flex items-center gap-1" aria-hidden>
          {cuisineEmoji(data.recipe.cuisine)}
        </span>
      </div>

      <section className="space-y-3" aria-label="Хоолны аюулгүй байдал ба шим тэжээл">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Харшлын мэдээлэл</p>
          {reviewed && meta?.allergen_status === "ingredients_reviewed" ? (
            <>
              <p className="mt-1">{allergens.length ? `Жорын орцонд: ${allergens.join(", ")}` : "Шалгасан орцын жагсаалтад 9 гол харшил үүсгэгч тэмдэглэгдээгүй."}</p>
              <p className="mt-2 text-xs">Орцын жагсаалтын шалгалт нь харшилгүй гэсэн баталгаа биш. Шошго, солих орц, гал тогооны бохирдлыг шалгаарай.</p>
            </>
          ) : (
            <p className="mt-1">Энэ жорын харшил үүсгэгч орцууд хараахан баталгаажаагүй. Харшилтай бол шууд аюулгүй гэж үзэж болохгүй.</p>
          )}
        </div>
        {nutritionAvailable && (
          <div className="rounded-2xl border border-[#dbe8d7] bg-[#f5faf2] p-4">
            <h2 className="font-bold text-[#244934]">Шим тэжээл · нэг порц</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {([["calories_kcal","Илчлэг","ккал"],["protein_g","Уураг","г"],["carbs_g","Нүүрс ус","г"],["fat_g","Өөх тос","г"]] as const).map(([key,label,unit]) => (
                meta?.[key] != null ? (
                  <div key={key}><dt className="text-xs text-zinc-600">{label}</dt><dd className="mt-1 font-bold text-[#214934]">{meta[key]} {unit}</dd></div>
                ) : null
              ))}
            </dl>
            <p className="mt-3 text-xs text-zinc-600">Эх сурвалж: {meta?.nutrition_source}. Тэжээллэг чанар нь орц, брэнд, хоол хийх аргаар өөрчлөгдөж болно.</p>
          </div>
        )}
        {meta?.source_url && (
          <p className="text-xs text-zinc-600">
            Жорын эх сурвалж: <a href={meta.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#276440] underline">Нээх</a>
            {meta.license_name ? ` · ${meta.license_name}` : ""}
          </p>
        )}
      </section>


      <ServingSlider
        value={serves}
        max={Math.max(12, base * 4)}
        onChange={setServes}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900">Орц, материал</h2>
        <IngredientGroupedList items={data.ingredients} ctx={ctx} />
      </section>

      {!!data.tags.length && (
        <div className="flex flex-wrap gap-2 text-xs">
          {data.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-700"
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {data.recipe.tips && (
        <div className="space-y-2">
          {data.recipe.tips
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((chunk, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-rose-100 bg-(--figma-soft) px-4 py-3 text-sm text-zinc-800"
              >
                {chunk}
              </div>
            ))}
        </div>
      )}

      <section className="space-y-3" id="making-guide">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Хийх заавар</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Алхмуудыг уншаад, доорх товчоор хоол хийх горимыг нээнэ үү.
          </p>
        </div>
        {data.steps.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
            Энэ жорын алхам ороогүй байна. Админ хэсгээс засварлаж нэмнэ үү.
          </p>
        ) : (
          <div className="space-y-3">
            {data.steps.map((st) => {
              const tpl = st.description_template?.trim();
              const body = tpl
                ? interpolateStep(tpl, substitutions)
                : st.description;
              return (
                <StepPreviewCard key={st.id} order={st.step_order} text={body} />
              );
            })}
          </div>
        )}
      </section>

      <RecipeDetailGallery galleryRaw={data.recipe.gallery_r2_keys} />
      {videoEmbed && (
        <section className="space-y-3" aria-labelledby="video-guide-title">
          <h2 id="video-guide-title" className="text-xl font-bold text-[#244934]">Видео заавар</h2>
          <div className="aspect-video overflow-hidden rounded-2xl bg-zinc-900">
            <iframe src={videoEmbed} title={`${data.recipe.title} видео заавар`}
              className="h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen />
          </div>
        </section>
      )}

      {data.steps.length > 0 && <Link
        href={`/recipe/${data.recipe.id}/cook?serves=${serves}`}
        className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex min-w-[220px] -translate-x-1/2 justify-center rounded-full px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#276440]/20 touch-manipulation md:bottom-6"
        style={{ backgroundColor: "var(--figma-primary)" }}
      >
        Алхмаар хоол хийх
      </Link>}
    </main>
  );
}
