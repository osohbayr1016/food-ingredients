"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { clientFetch } from "@/lib/clientApi";

export type PlanCloudData = {
  plan: Record<string,string>;
  portions: Record<string,number>;
  checked: Record<string,boolean>;
  titles: Record<string,string>;
};
type CloudSnapshot = PlanCloudData & {
  week_start: string;
  has_remote: boolean;
  revision: number;
  updated_at: string | null;
};

/** User-controlled cloud synchronization; no automatic writes or destructive merges. */
export function MealPlanCloudSync({
  weekStart, local, onRestore,
}: {
  weekStart: string;
  local: PlanCloudData;
  onRestore: (snapshot: PlanCloudData) => void;
}) {
  const { user, ready } = useAuth();
  const [remote, setRemote] = useState<CloudSnapshot | null>(null);
  const [remoteKey, setRemoteKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const key = user ? `${user.id}:${weekStart}` : "";

  const reload = useCallback(async () => {
    setRemote(null);
    setRemoteKey("");
    if (!user) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await clientFetch(
        `/me/meal-plan?week=${encodeURIComponent(weekStart)}`,
        {cache:"no-store"},
      );
      if (!response.ok) throw Error("load_failed");
      const data = await response.json() as CloudSnapshot;
      if (data.week_start !== weekStart || !Number.isSafeInteger(data.revision) ||
          !data.plan || typeof data.plan !== "object" ||
          !data.portions || typeof data.portions !== "object" ||
          !data.checked || typeof data.checked !== "object" ||
          !data.titles || typeof data.titles !== "object") throw Error("invalid_response");
      setRemote(data);
      setRemoteKey(`${user.id}:${weekStart}`);
    } catch {
      setError("Бүртгэл дээрх төлөвлөгөөг уншиж чадсангүй. Холболтоо шалгаарай.");
    } finally {
      setBusy(false);
    }
  }, [user?.id, weekStart]);

  useEffect(() => { void reload(); }, [reload]);

  async function save() {
    if (!user || !remote || remoteKey !== key || busy) return;
    if (remote.has_remote && !window.confirm(
      "Энэ төхөөрөмжийн долоо хоногийн төлөвлөгөөг бүртгэл дээрх хувилбараар солих уу? Бүртгэл дээр хадгалсан өмнөх хувилбар дарагдана.",
    )) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await clientFetch("/me/meal-plan", {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          week_start:weekStart,
          expected_revision:remote.revision,
          ...local,
        }),
      });
      if (res.status === 409) {
        setRemote(null);
        setRemoteKey("");
        setError("Өөр төхөөрөмж дээр төлөвлөгөө өөрчлөгджээ. Эхлээд шинэчлээд дахин оролдоорой.");
        return;
      }
      if (!res.ok) throw Error("save_failed");
      const response = await res.json() as {revision:number;updated_at:string};
      if (!Number.isSafeInteger(response.revision)) throw Error("invalid_revision");
      setRemote({
        ...local, week_start:weekStart, has_remote:true,
        revision:response.revision,updated_at:response.updated_at,
      });
      setRemoteKey(key);
      setMessage("Төлөвлөгөө бүртгэлд хадгалагдлаа. Өөр төхөөрөмжөөс татаж болно.");
    } catch {
      setError("Бүртгэлд хадгалж чадсангүй. Энэ төхөөрөмжийн төлөвлөгөө хэвээр.");
    } finally {
      setBusy(false);
    }
  }

  function restore() {
    if (!user || !remote?.has_remote || remoteKey !== key || busy) return;
    if (Object.values(local.plan).some(Boolean) &&
        !window.confirm("Энэ төхөөрөмжийн сонголт, порц, жагсаалтын тэмдэглэгээг бүртгэл дээрх хувилбараар солих уу?")) return;
    onRestore({
      plan:remote.plan,portions:remote.portions,checked:remote.checked,titles:remote.titles,
    });
    setError("");
    setMessage("Бүртгэл дээрх төлөвлөгөөг энэ төхөөрөмжид татлаа.");
  }

  if (!ready) return null;
  if (!user) return (
    <p className="text-xs text-[#607567]">
      Төлөвлөгөөгөө өөр төхөөрөмжөөс ашиглах бол{" "}
      <Link href="/login?next=/plan" className="font-bold text-[#276440] underline">нэвтэрч</Link>{" "}
      бүртгэлдээ хадгалаарай.
    </p>
  );
  return (
    <section aria-label="Төлөвлөгөөг бүртгэлтэй синк хийх"
      className="space-y-3 rounded-2xl border border-[#dce8d8] bg-[#f7faf5] p-4">
      <div>
        <h2 className="text-sm font-bold text-[#24523a]">Төхөөрөмж хооронд хадгалах</h2>
        <p className="mt-1 text-xs text-[#617362]">
          Төлөвлөгөө автоматаар солигдохгүй. Бүртгэлд хадгалах эсвэл татахаа та сонгоно.
          {remote?.has_remote ? ` Бүртгэлийн хувилбар: ${remote.revision}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !remote || remoteKey !== key}
          onClick={() => void save()}
          className="min-h-11 rounded-xl bg-[#276440] px-4 text-xs font-bold text-white disabled:opacity-50">
          {busy ? "Ажиллаж байна…" : "Бүртгэлд хадгалах"}
        </button>
        <button type="button" disabled={busy || !remote?.has_remote || remoteKey !== key}
          onClick={restore}
          className="min-h-11 rounded-xl border border-[#cde1c9] bg-white px-4 text-xs font-bold text-[#276440] disabled:opacity-50">
          Бүртгэлээс татах
        </button>
        <button type="button" disabled={busy} onClick={() => void reload()}
          className="min-h-11 rounded-xl px-3 text-xs font-bold text-[#607567] disabled:opacity-50">
          Шинэчлэх
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-amber-800">{error}</p>}
      {message && <p role="status" className="text-xs text-[#276440]">{message}</p>}
    </section>
  );
}
