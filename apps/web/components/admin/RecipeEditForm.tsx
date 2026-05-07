"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RecipeMetaFields } from "@/components/admin/RecipeMetaFields";
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
        setErr("Хадгалахад алдаа гарлаа.");
        return;
      }
      setSavedMsg("Хадгалагдлаа.");
    } finally {
      setSaving(false);
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
        setPayload={setPayload}
        setErr={setErr}
        setSavedMsg={setSavedMsg}
      />

      <RecipeMetaFields
        recipe={payload.recipe}
        onChange={(recipe) => setPayload({ ...payload, recipe })}
      />
      <RecipeIngredientsEditor
        ingredients={payload.ingredients}
        categories={categories}
        onChange={(ingredients) => setPayload({ ...payload, ingredients })}
      />
      <RecipeStepsEditor
        steps={payload.steps}
        onChange={(steps) => setPayload({ ...payload, steps })}
      />
      <RecipeTagsPicker
        tags={tags}
        selectedIds={payload.tag_ids ?? []}
        onChange={(tag_ids) => setPayload({ ...payload, tag_ids })}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="rounded-xl bg-[#E23E3E] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
        <Link
          href="/admin/recipes"
          className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm text-zinc-800"
        >
          Буцах
        </Link>
        <Link
          href={`/recipe/${recipeId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm text-red-600"
        >
          Сайт дээр үзэх
        </Link>
      </div>
    </div>
  );
}
