"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RecipeMetaFields } from "@/components/admin/RecipeMetaFields";
import { RecipeMetadataEditor } from "@/components/admin/RecipeMetadataEditor";
import { RecipeIngredientsEditor } from "@/components/admin/RecipeIngredientsEditor";
import { RecipeStepsEditor } from "@/components/admin/RecipeStepsEditor";
import { RecipeTagsPicker } from "@/components/admin/RecipeTagsPicker";
import { RecipeEditImagePasteSection } from "@/components/admin/RecipeEditImagePasteSection";
import { RecipeEditAlerts } from "@/components/admin/RecipeEditAlerts";
import { useAdminSecret } from "@/components/admin/AdminSecretContext";
import { adminDetailToPayload } from "@/lib/adminRecipeEditMap";
import type { RecipePatchPayload } from "@/lib/adminRecipeTypes";
import {
  fetchAdminRecipe,
  fetchAdminTags,
  fetchIngredientCategories,
  approveAdminRecipe,
  publishAdminRecipe,
} from "@/lib/adminRecipeFetch";
import { patchAdminRecipe } from "@/lib/adminRecipeImportSubmit";

type Props = { recipeId: string };

export function RecipeEditForm({ recipeId }: Props) {
  const { adminSecret } = useAdminSecret();
  const [payload, setPayload] = useState<RecipePatchPayload | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setSavedMsg(null);
    if (!adminSecret.trim()) {
      setLoading(false);
      setPayload(null);
      setErr("ADMIN нууц оруулна уу.");
      return;
    }
    setLoading(true);
    try {
      const [recipeRes, catRes, tagRes] = await Promise.all([
        fetchAdminRecipe(adminSecret, recipeId),
        fetchIngredientCategories(adminSecret),
        fetchAdminTags(adminSecret),
      ]);
      if (!recipeRes.ok || !recipeRes.data.recipe) {
        setErr("Жор олдсонгүй.");
        setPayload(null);
        return;
      }
      setPayload(adminDetailToPayload(recipeRes.data));
      setDirty(false);
      setCategories(catRes.categories);
      setTags(tagRes.tags);
    } finally {
      setLoading(false);
    }
  }, [adminSecret, recipeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!payload || !adminSecret.trim()) return;
    setSaving(true);
    setErr(null);
    setSavedMsg(null);
    try {
      const res = await patchAdminRecipe(adminSecret, recipeId, payload);
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { details?: string[] };
        setErr(data.details?.length ? "Шалгалт: " + data.details.join(", ") : "Хадгалахад алдаа гарлаа.");
        return;
      }
      setPayload(prev => prev ? {
        ...prev, recipe: {...prev.recipe,is_published:false},
        metadata: {...prev.metadata, review_status:"pending", allergen_status:"unknown"},
      } : null);
      setDirty(false);
      setSavedMsg("Ноорог хадгалагдлаа. Жорыг дахин нягтлаад хяналтаар батална уу.");
    } catch {
      setErr("Хадгалах үед холболтын алдаа гарлаа. Дахин оролдоорой.");
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    if (!payload || dirty || !adminSecret.trim() || reviewing) return;
    if (!window.confirm("Орц, хугацаа, алхам, харшлын мэдээлэл, эх сурвалж болон ашиглах эрхийг шалгасан уу?")) return;
    setReviewing(true);
    setErr(null);
    try {
      const res = await approveAdminRecipe(adminSecret,recipeId);
      if (!res.ok) {
        setErr("Нягтлах нөхцөл хангагдаагүй. Хугацаа, орц, алхам, лиценз болон тайлбарыг шалгаарай.");
        return;
      }
      setPayload(prev => prev ? {...prev,metadata:{...prev.metadata,review_status:"approved"}} : prev);
      setSavedMsg("Жор хяналтаар батлагдлаа. Нийтлэх эсвэл өдөр тутмын дараалалд оруулах боломжтой.");
    } catch {
      setErr("Хяналтын хүсэлт амжилтгүй. Дахин оролдоорой.");
    } finally {
      setReviewing(false);
    }
  }

  async function publish() {
    if (!payload || dirty || publishing || payload.metadata?.review_status !== "approved") return;
    if (!window.confirm("Энэ баталгаажсан жорыг одоо нийтлэх үү?")) return;
    setPublishing(true);
    setErr(null);
    try {
      const res = await publishAdminRecipe(adminSecret,recipeId);
      if (!res.ok) {
        setErr("Нийтлэх боломжгүй. Нийтлэх эрх, хяналтын төлөв, орц, алхмыг шалгаарай.");
        return;
      }
      setPayload(prev => prev ? {...prev,recipe:{...prev.recipe,is_published:true}} : prev);
      setSavedMsg("Жор амжилттай нийтлэгдлээ.");
    } catch {
      setErr("Нийтлэх үед холболтын алдаа гарлаа.");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">Уншиж байна…</p>
    );
  }

  if (!payload) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {err ?? "Өгөгдөл алга."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <RecipeEditAlerts err={err} savedMsg={savedMsg} />
      <RecipeEditImagePasteSection
        recipeId={recipeId}
        adminSecret={adminSecret}
        payload={payload}
        setPayload={(value) => { setDirty(true); setPayload(value); }}
        setErr={setErr}
        setSavedMsg={setSavedMsg}
      />

      <RecipeMetaFields
        recipe={payload.recipe}
        onChange={(recipe) => { setDirty(true); setPayload({ ...payload, recipe:{...recipe,is_published:false},
          metadata:{...payload.metadata,review_status:"pending",allergen_status:"unknown"} }); }}
      />
      <RecipeMetadataEditor
        value={payload.metadata ?? {}}
        onChange={(metadata) => { setDirty(true); setPayload({ ...payload, metadata:{...metadata,review_status:"pending"} }); }}
      />
      <RecipeIngredientsEditor
        ingredients={payload.ingredients}
        categories={categories}
        onChange={(ingredients) => { setDirty(true); setPayload({
          ...payload,recipe:{...payload.recipe,is_published:false},ingredients,
          metadata: { ...payload.metadata, review_status: "pending", allergen_status: "unknown" },
        }); }}
      />
      <RecipeStepsEditor
        steps={payload.steps}
        onChange={(steps) => { setDirty(true); setPayload({
          ...payload,recipe:{...payload.recipe,is_published:false},steps,
          metadata: { ...payload.metadata, review_status: "pending", allergen_status:"unknown" },
        }); }}
      />
      <RecipeTagsPicker
        tags={tags}
        selectedIds={payload.tag_ids ?? []}
        onChange={(tag_ids) => { setDirty(true); setPayload({ ...payload,recipe:{...payload.recipe,is_published:false},
          metadata:{...payload.metadata,review_status:"pending"},tag_ids }); }}
      />

      {dirty && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
        Хадгалаагүй өөрчлөлт байна. Хадгалсны дараа өмнөх баталгаажуулалт хүчингүй болно.
      </p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="min-h-11 rounded-xl bg-[#276440] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
        {!payload.recipe.is_published && payload.metadata?.review_status !== "approved" && (
          <button type="button" disabled={saving || reviewing || publishing || dirty}
            onClick={() => void approve()}
            className="min-h-11 rounded-xl border border-[#c6dcbf] bg-[#edf6e8] px-5 text-sm font-semibold text-[#276440] disabled:opacity-40">
            {reviewing ? "Баталж байна…" : "Хяналтаар батлах"}
          </button>
        )}
        {!payload.recipe.is_published && payload.metadata?.review_status === "approved" && (
          <button type="button" disabled={saving || reviewing || publishing || dirty}
            onClick={() => void publish()}
            className="min-h-11 rounded-xl bg-[#173f30] px-5 text-sm font-semibold text-white disabled:opacity-40">
            {publishing ? "Нийтэлж байна…" : "Одоо нийтлэх"}
          </button>
        )}
        <Link
          href="/admin/recipes"
          className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm text-zinc-800"
        >
          Буцах
        </Link>
        {payload.recipe.is_published && <Link
          href={`/recipe/${recipeId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm text-red-600"
        >
          Сайт дээр үзэх
        </Link>}
      </div>
    </div>
  );
}
