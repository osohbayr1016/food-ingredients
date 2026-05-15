"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RecipeManagementRow } from "@/components/admin/RecipeManagementRow";
import { useAdminSecret } from "@/components/admin/AdminSecretContext";
import {
  deleteAdminRecipe,
  fetchAdminRecipes,
  type AdminRecipeListRow,
} from "@/lib/adminRecipeFetch";

export function RecipeManagementList() {
  const { adminSecret } = useAdminSecret();
  const [rows, setRows] = useState<AdminRecipeListRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminRecipeListRow | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    if (!adminSecret.trim()) {
      setErr("Дээрх талбарт админ түлхүүр оруулна уу.");
      setRows(null);
      return;
    }
    setLoading(true);
    try {
      const { ok, recipes } = await fetchAdminRecipes(adminSecret);
      if (!ok) {
        setErr("Жагсаалт ачаалахгүй байна.");
        setRows(null);
        return;
      }
      setRows(recipes);
    } finally {
      setLoading(false);
    }
  }, [adminSecret]);

  useEffect(() => {
    if (adminSecret.trim()) void load();
    else setRows(null);
  }, [adminSecret, load]);

  async function confirmDelete() {
    const row = pendingDelete;
    if (!row || !adminSecret.trim()) return;
    setDeletingId(row.id);
    setErr(null);
    try {
      const res = await deleteAdminRecipe(adminSecret, row.id);
      if (!res.ok) {
        setErr("Устгаж чадсангүй.");
        return;
      }
      setRows((prev) => (prev ?? []).filter((r) => r.id !== row.id));
      setPendingDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Жорын удирдлага</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Жорыг засах, үзэх, устгах. Нийтлэсэн жор вэб дээр харагдана.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="rounded-xl bg-[#E23E3E] px-4 py-2 text-sm font-medium text-white"
            >
              Шинэ жор нэмэх
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm disabled:opacity-50"
            >
              {loading ? "Уншиж байна…" : "Сэргээх"}
            </button>
          </div>
        </header>

        {err ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </p>
        ) : null}

        {rows && rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
            Жор алга. «Шинэ жор нэмэх» эсвэл «Импорт» хуудаснаас нэмнэ үү.
          </p>
        ) : null}

        {rows && rows.length > 0 ? (
          <ul className="space-y-3">
            {rows.map((r) => (
              <RecipeManagementRow
                key={r.id}
                r={r}
                deletingId={deletingId}
                onDeleteClick={() => setPendingDelete(r)}
              />
            ))}
          </ul>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        title="Жор устгах"
        message={
          pendingDelete
            ? `«${pendingDelete.title}»-г устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.`
            : ""
        }
        cancelLabel="Цуцлах"
        confirmLabel="Устгах"
        pending={deletingId != null}
        onCancel={() => !deletingId && setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
