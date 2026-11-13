"use client";

import Link from "next/link";
import type { AdminRecipeListRow } from "@/lib/adminRecipeFetch";

export function RecipeManagementRow({
  r,
  deletingId,
  onDeleteClick,
}: {
  r: AdminRecipeListRow;
  deletingId: string | null;
  onDeleteClick: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-zinc-900">{r.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>{r.cuisine}</span>
          <span
            className={
              r.is_published
                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800"
                : "rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700"
            }
          >
            {r.is_published ? "Нийтэлсэн" : "Ноорог"}
          </span>
          <span className={r.review_status === "approved" ? "rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800" : "rounded-full bg-amber-50 px-2 py-0.5 text-amber-800"}>
            {r.review_status === "approved" ? "Хянасан" : "Шалгаагүй"}
          </span>
          {!r.license_name && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-800">Ашиглах эрх дутуу</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={`/admin/recipes/${r.id}/edit`}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          Засах
        </Link>
        {r.is_published ? <Link
          href={`/recipe/${r.id}`}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-[#276440] hover:bg-zinc-50"
          target="_blank" rel="noreferrer">Нээх</Link> : null}
        <button
          type="button"
          onClick={onDeleteClick}
          disabled={deletingId === r.id}
          className="text-sm text-red-700 underline underline-offset-2 disabled:opacity-50"
        >
          Устгах
        </button>
      </div>
    </li>
  );
}
