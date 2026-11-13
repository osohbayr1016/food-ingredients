"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RecipeManagementRow } from "@/components/admin/RecipeManagementRow";
import { useAdminSecret } from "@/components/admin/AdminSecretContext";
import {
  deleteAdminRecipe,
  fetchAdminRecipes,
  type AdminRecipeListRow,
  type AdminRecipeStatus,
} from "@/lib/adminRecipeFetch";

export function RecipeManagementList() {
  const { adminSecret } = useAdminSecret();
  const [rows, setRows] = useState<AdminRecipeListRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminRecipeListRow | null>(null);
  const [status, setStatus] = useState<AdminRecipeStatus>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (nextPage = 1) => {
    const callId = ++requestId.current;
    setErr(null);
    if (!adminSecret.trim()) {
      setErr("Дээрх талбарт админ түлхүүр оруулна уу.");
      setRows(null);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchAdminRecipes(adminSecret, nextPage, status);
      if (callId !== requestId.current) return;
      if (!result.ok) throw new Error("admin_recipes_failed");
      setRows(prev => {
        if (nextPage === 1) return result.recipes;
        const seen = new Set((prev ?? []).map(r => r.id));
        return [...(prev ?? []), ...result.recipes.filter(r => !seen.has(r.id))];
      });
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch {
      if (callId === requestId.current) setErr("Жагсаалт ачаалж чадсангүй. Дахин оролдоорой.");
    } finally {
      if (callId === requestId.current) setLoading(false);
    }
  }, [adminSecret, status]);

  useEffect(() => {
    if (adminSecret.trim()) void load(1);
    else { ++requestId.current; setRows(null); setHasMore(false); }
    return () => { ++requestId.current; };
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
              className="rounded-xl bg-[#276440] px-4 py-2 text-sm font-medium text-white"
            >
              Шинэ жор нэмэх
            </Link>
            <button
              type="button"
              onClick={() => void load(1)}
              disabled={loading}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm disabled:opacity-50"
            >
              {loading ? "Уншиж байна…" : "Сэргээх"}
            </button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-zinc-700">Төлөвөөр шүүх
            <select value={status} onChange={e => setStatus(e.target.value as AdminRecipeStatus)}
              className="ml-3 min-h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm">
              <option value="all">Бүх жор</option>
              <option value="pending">Шалгалт хүлээж байгаа</option>
              <option value="ready">Шалгалт дууссан ноорог</option>
              <option value="draft">Бүх ноорог</option>
              <option value="published">Нийтэлсэн</option>
            </select>
          </label>
          {rows && <span className="text-xs text-zinc-500">{rows.length} жор ачаалсан</span>}
        </div>
        {err && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
          <button type="button" onClick={() => void load(page)} className="ml-3 font-semibold underline">Дахин оролдох</button>
        </div>}
        {loading && !rows && <p role="status" className="py-6 text-center text-sm text-zinc-500">Жорууд ачаалж байна…</p>}

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
        {hasMore && <button type="button" disabled={loading} onClick={() => void load(page+1)}
          className="mx-auto mt-5 block min-h-11 rounded-xl border border-[#dce7d7] bg-white px-6 text-sm font-semibold text-[#276440] disabled:opacity-50">
          {loading ? "Ачаалж байна…" : "Дараагийн жоруудыг үзэх"}
        </button>}
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
