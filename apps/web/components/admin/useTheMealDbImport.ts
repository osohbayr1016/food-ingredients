"use client";

import { useCallback, useState } from "react";
import { useAdminSecret } from "@/components/admin/AdminSecretContext";
import type { RecipePatchPayload } from "@/lib/adminRecipeTypes";
import {
  theMealDbAdminCommit,
  theMealDbAdminPreview,
  theMealDbAdminSearch,
  type MealSearchRow,
  type TheMealDbDedupe,
} from "@/lib/theMealDbAdminFetch";

export function useTheMealDbImport() {
  const { adminSecret } = useAdminSecret();
  const [q, setQ] = useState("");
  const [meals, setMeals] = useState<MealSearchRow[]>([]);
  const [picked, setPicked] = useState<MealSearchRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [patch, setPatch] = useState<RecipePatchPayload | null>(null);
  const [dedupe, setDedupe] = useState<TheMealDbDedupe | null>(null);
  const [skipImage, setSkipImage] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const token = adminSecret.trim();

  const resetSelection = useCallback(() => {
    setPatch(null);
    setDedupe(null);
    setCreatedId(null);
  }, []);

  const onSearch = useCallback(async () => {
    setMsg(null);
    resetSelection();
    if (!token) {
      setMsg("ADMIN нууц (эсвэл нэвтрэх) шаардлагатай.");
      return;
    }
    setBusy(true);
    try {
      const { ok, meals: list, error } = await theMealDbAdminSearch(token, q);
      if (!ok) {
        setMsg(
          error === "themealdb_fetch_failed"
            ? "TheMealDB холбогдож чадсангүй."
            : "Хайлт амжилтгүй.",
        );
        setMeals([]);
        return;
      }
      setMeals(list);
      if (!list.length) setMsg("Илэрцгүй.");
    } finally {
      setBusy(false);
    }
  }, [q, resetSelection, token]);

  const onPreview = useCallback(async () => {
    setMsg(null);
    setCreatedId(null);
    if (!token || !picked) return;
    setBusy(true);
    try {
      const { ok, patch: p, dedupe: d, error } = await theMealDbAdminPreview(
        token,
        picked.idMeal,
      );
      if (!ok) {
        setPatch(null);
        setDedupe(null);
        setMsg(error === "not_found" ? "Жор олдсонгүй." : "Урьдчилахад алдаа.");
        return;
      }
      setPatch(p);
      setDedupe(d);
    } finally {
      setBusy(false);
    }
  }, [picked, token]);

  const commit = useCallback(
    async (publish: boolean) => {
      setMsg(null);
      setCreatedId(null);
      if (!token || !picked) return;
      if (dedupe?.conflict === "external") {
        setMsg("Энэ TheMealDB ID аль хэдийн импортлогдсон.");
        return;
      }
      setBusy(true);
      try {
        const res = await theMealDbAdminCommit(token, {
          idMeal: picked.idMeal,
          publish,
          skip_image: skipImage,
        });
        if (res.status === 409 && res.recipe_id) {
          setMsg("Давхар оролт: жор аль хэдийн байна.");
          return;
        }
        if (!res.ok || !res.id) {
          setMsg("Хадгалахад алдаа.");
          return;
        }
        setCreatedId(res.id);
      } finally {
        setBusy(false);
      }
    },
    [dedupe?.conflict, picked, skipImage, token],
  );

  return {
    q,
    setQ,
    meals,
    picked,
    setPicked,
    busy,
    msg,
    patch,
    dedupe,
    skipImage,
    setSkipImage,
    createdId,
    resetSelection,
    onSearch,
    onPreview,
    commit,
  };
}
