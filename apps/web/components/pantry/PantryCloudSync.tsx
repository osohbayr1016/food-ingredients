"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { clientFetch } from "@/lib/clientApi";
import { normalizePantry, type PantryInventoryItem } from "@/lib/pantryInventory";
import { useCallback, useEffect, useState } from "react";

type RemoteSnapshot = {
  items: PantryInventoryItem[];
  revision: number;
  has_remote: boolean;
  updated_at: string | null;
};

export function PantryCloudSync({
  items, onRestore,
}: {
  items: PantryInventoryItem[];
  onRestore: (items: PantryInventoryItem[]) => void;
}) {
  const { user, ready } = useAuth();
  const [remote, setRemote] = useState<RemoteSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    if (!user) {setRemote(null);return;}
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response=await clientFetch("/me/pantry",{cache:"no-store"});
      if(!response.ok) throw new Error("load_failed");
      const data=await response.json() as RemoteSnapshot;
      if(!Array.isArray(data.items) || !Number.isSafeInteger(data.revision)) throw new Error("invalid_cloud_response");
      setRemote({...data,items:normalizePantry(data.items)});
    }catch{
      setError("Бүртгэл дээрх орцуудыг ачаалж чадсангүй. Холболтоо шалгаарай.");
    }finally{setBusy(false);}
  },[user?.id]);

  useEffect(()=>{void reload();},[reload]);

  async function save() {
    if(!user || !remote || busy) return;
    if(remote.has_remote && remote.items.length &&
      !window.confirm("Энэ төхөөрөмжийн орцоор бүртгэл дээрх орцуудыг солих уу?")) return;
    setBusy(true);setError("");setMessage("");
    try{
      const response=await clientFetch("/me/pantry",{
        method:"PUT",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          items:normalizePantry(items),expected_revision:remote.revision,
        }),
      });
      if(response.status===409) {
        setRemote(null);
        setError("Өөр төхөөрөмж дээр орц өөрчлөгдсөн байна. Эхлээд шинэ мэдээллийг татаж шалгаад дахин хадгалаарай.");
        return;
      }
      if(!response.ok) throw new Error("save_failed");
      const data=await response.json() as {revision:number;updated_at:string};
      setRemote({items:normalizePantry(items),has_remote:true,
        revision:data.revision,updated_at:data.updated_at});
      setMessage("Орцууд бүртгэлд хадгалагдлаа. Өөр төхөөрөмжөөс эндээс татаж болно.");
    }catch{setError("Бүртгэл рүү хадгалж чадсангүй. Төхөөрөмжийн орцууд хэвээр байна.");}
    finally{setBusy(false);}
  }

  function restore() {
    if (!remote?.has_remote || busy) return;
    if(items.length && !window.confirm("Энэ төхөөрөмжийн одоогийн орцуудыг бүртгэл дээрх орцоор солих уу?")) return;
    onRestore(remote.items);
    setMessage("Бүртгэл дээрх орцуудыг энэ төхөөрөмжид хууллаа.");
    setError("");
  }

  if(!ready) return <p role="status" className="text-sm text-[#6d7e70]">Бүртгэл шалгаж байна…</p>;
  if(!user) return <div className="space-y-2 text-sm text-[#617362]">
    <p>Нэвтрэхгүйгээр энэ төхөөрөмж дээрээ орцоо хадгалж болно. Синк хийхэд бүртгэл шаардлагатай.</p>
    <Link href="/login?next=/pantry" className="inline-flex min-h-11 items-center rounded-xl bg-[#edf6e8] px-4 font-semibold text-[#276440]">Нэвтрэх</Link>
  </div>;

  return <div className="space-y-3 text-sm">
    <p className="text-[#667969]">Бүртгэл дээр хадгалах болон өөр төхөөрөмжөөс татахыг та өөрөө сонгоно. Автоматаар орц солихгүй.</p>
    <p className="text-xs font-semibold text-[#496b51]">
      {remote ? remote.has_remote
        ? `Бүртгэлд ${remote.items.length} орц · хувилбар ${remote.revision}`
        : "Бүртгэл дээр орц хадгалагдаагүй"
        : "Бүртгэл дээрх мэдээллийг шалгана уу"}
    </p>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy || !remote} onClick={()=>void save()}
        className="min-h-11 rounded-xl bg-[#276440] px-4 font-semibold text-white disabled:opacity-50">
        {busy?"Ажиллаж байна…":"Бүртгэлд хадгалах"}
      </button>
      <button type="button" disabled={busy || !remote?.has_remote} onClick={restore}
        className="min-h-11 rounded-xl border border-[#cee1c9] bg-white px-4 font-semibold text-[#276440] disabled:opacity-50">
        Бүртгэлээс татах
      </button>
      <button type="button" disabled={busy} onClick={()=>void reload()}
        className="min-h-11 rounded-xl px-3 font-semibold text-[#536d57] disabled:opacity-50">
        Шинэчлэх
      </button>
    </div>
    {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-[#edf6e8] p-3 text-[#276440]">{message}</p>}
  </div>;
}
