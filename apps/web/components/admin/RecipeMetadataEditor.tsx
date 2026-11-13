"use client";

import { ALLERGEN_OPTIONS, type RecipeMetadata } from "@/lib/recipeMetadata";

export function RecipeMetadataEditor({
  value, onChange,
}: {
  value: RecipeMetadata;
  onChange: (v: RecipeMetadata) => void;
}) {
  const patch = (p: Partial<RecipeMetadata>) => onChange({ ...value, ...p });
  const nutritionField = (
    key: "calories_kcal" | "protein_g" | "carbs_g" | "fat_g",
    label: string,
  ) => (
    <label className="block text-sm" key={key}>
      <span className="font-medium text-zinc-700">{label}</span>
      <input type="number" inputMode="decimal" min="0" max={key === "calories_kcal" ? 10000 : 1000} step="0.1"
        value={value[key] ?? ""}
        onChange={e => patch({ [key]: e.target.value === "" ? null : Number(e.target.value) })}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2" />
    </label>
  );

  return (
    <section className="space-y-5 rounded-2xl border border-emerald-200 bg-[#f7faf5] p-5">
      <div>
        <h2 className="text-lg font-bold text-[#214c33]">Эх сурвалж ба баталгаажуулалт</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          Жорын эрх, орцын аюулгүй байдал, хугацаа, алхмуудыг хүн шалгасны дараа л нийтэлнэ.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">Эх сурвалжийн URL
          <input type="url" value={value.source_url ?? ""} placeholder="https://..."
            onChange={e => patch({ source_url: e.target.value || null })}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2" />
        </label>
        <label className="block text-sm">Ашиглах эрх / лиценз
          <input value={value.license_name ?? ""} placeholder="Original / CC BY / ..."
            onChange={e => patch({ license_name: e.target.value || null })}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2" />
        </label>
      </div>
      <label className="block text-sm">YouTube эсвэл Vimeo зааврын URL
        <input type="url" value={value.video_url ?? ""} placeholder="https://www.youtube.com/watch?v=..."
          onChange={e => patch({ video_url: e.target.value || null })}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2" />
      </label>
      <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm">
        <p className="font-semibold text-[#214c33]">Жорын хяналтын төлөв: {value.review_status === "approved" ? "Баталгаажсан" : "Шалгалт хүлээж байна"}</p>
        <p className="mt-1 text-xs text-zinc-600">Жороо хадгалж, зураг/видеоны эрх, орц, хугацаа болон алхмуудыг хянасны дараа доорх тусдаа “Хяналтаар батлах” үйлдлийг ашиглана.</p>
      </div>
      <div className="space-y-2 border-t border-emerald-100 pt-4">
        <h3 className="font-semibold">Харшлын орцын шалгалт</h3>
        <p className="text-xs text-zinc-600">Энэ нь зөвхөн жор дахь орцын мэдээллийн шалгалт. Бохирдол, савлагааны эрсдэлийг үгүйсгэхгүй.</p>
        <label className="block text-sm">Шалгалтын төлөв
          <select value={value.allergen_status ?? "unknown"}
            onChange={e => patch({ allergen_status: e.target.value as RecipeMetadata["allergen_status"] })}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2">
            <option value="unknown">Шалгаагүй</option>
            <option value="ingredients_reviewed">Орцын жагсаалтыг хүн шалгасан</option>
          </select>
        </label>
        <label className="block text-sm">Орцын харшлын шалгалтын эх сурвалж (HTTPS)
          <input type="url" value={value.allergen_evidence_url ?? ""}
            placeholder="https://.../ingredient-or-label-evidence"
            onChange={e=>patch({allergen_evidence_url:e.target.value||null,allergen_status:"unknown"})}
            className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2"/>
          <span className="mt-1 block text-xs text-[#7a7462]">Эх сурвалжгүй бол “орц шалгасан” төлөв сонгосон ч баталгаажуулж болохгүй.</span>
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALLERGEN_OPTIONS.map(([code,label]) => (
            <label key={code} className="flex min-h-10 items-center gap-2 rounded-lg bg-white px-2 py-2 text-xs">
              <input type="checkbox" className="h-4 w-4 accent-emerald-700"
                checked={(value.allergens ?? []).includes(code)}
                onChange={e => {
                  const prev = value.allergens ?? [];
                  patch({
                    allergens: e.target.checked ? [...new Set([...prev, code])] : prev.filter(x => x !== code),
                    allergen_status: "unknown",
                  });
                }} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-3 border-t border-emerald-100 pt-4">
        <h3 className="font-semibold">Шим тэжээл — нэг порцод</h3>
        <p className="text-xs text-zinc-600">Тоо баримтыг зөвхөн шалгасан найдвартай эх сурвалжаас оруулна. Хоосон утга хэрэглэгчид харагдахгүй.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {nutritionField("calories_kcal", "Илчлэг · ккал")}
          {nutritionField("protein_g", "Уураг · г")}
          {nutritionField("carbs_g", "Нүүрс ус · г")}
          {nutritionField("fat_g", "Өөх тос · г")}
        </div>
        <label className="block text-sm">Шим тэжээлийн тооцооны баримтын холбоос (HTTPS)
          <input type="url" value={value.nutrition_evidence_url??""}
            placeholder="https://.../nutrition-data"
            onChange={e=>patch({nutrition_evidence_url:e.target.value||null})}
            className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2"/>
          <span className="mt-1 block text-xs text-[#7a7462]">Баримтын холбоосгүй тооцоолол хэрэглэгчид баталгаажсан мэт харагдахгүй.</span>
        </label>
        <label className="block text-sm">Шим тэжээлийн эх сурвалж, тооцооны тайлбар
          <input value={value.nutrition_source ?? ""} maxLength={300}
            onChange={e => patch({ nutrition_source: e.target.value || null })}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2" />
        </label>
      </div>
      <label className="block text-sm font-semibold text-zinc-700">Хяналтын тэмдэглэл (сонголтоор)
        <textarea maxLength={2000} value={value.review_notes??""}
          onChange={e=>patch({review_notes:e.target.value||null})}
          placeholder="Шалгасан эх сурвалж, порцын тооцоолол, онцгой анхааруулга…"
          className="mt-1 min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-normal"/>
      </label>
    </section>
  );
}
