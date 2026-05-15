"use client";

import type { NutritionTargets } from "@/lib/nutritionTargets";

export function NutritionTargetsPanel({ targets }: { targets: NutritionTargets | null }) {
  if (!targets) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500">
        Өгөгдлөө оруулна уу. Доорх тоо нь зөвхөн ойролцоо тооцоо болохыг анхаарна уу.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
        Өдрийн тооцоолол
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">
            <span className="block font-medium text-zinc-600">Суурь илчлэг</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-400">
              Хөдөлгөөн хийхгүй үед биеийн хэрэгцээ
            </span>
          </dt>
          <dd className="mt-1 font-bold text-zinc-900">{targets.bmr} ккал</dd>
        </div>
        <div>
          <dt className="text-zinc-500">
            <span className="block font-medium text-zinc-600">Өдрийн нийт илчлэг</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-400">
              Таны түвшингээр тооцсон бүх өдрийн зарцуулалт
            </span>
          </dt>
          <dd className="mt-1 font-bold text-zinc-900">{targets.tdee} ккал</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-500">Зорилтот идэх илчлэг</dt>
          <dd className="text-lg font-bold text-(--figma-primary)">
            ~{targets.target_kcal} ккал / өдөр
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-500">Уураг (зөвлөмж)</dt>
          <dd className="font-semibold text-zinc-900">
            {targets.protein_g_low}–{targets.protein_g_high} г / өдөр
          </dd>
        </div>
      </dl>
      <p className="border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-500">
        Энэ нь анагаах ухааны зөвлөгөө биш. Жин, эрүүл мэндийн зорилгоор мэргэжлийн эмч,
        дэглэгчтэй ярилцана уу.
      </p>
    </div>
  );
}
