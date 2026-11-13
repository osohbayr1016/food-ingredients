"use client";

import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import { invalidateRecipeLibraryIds } from "@/lib/recipeLibraryCache";
import { readLikedIds, removeLikedIdsFromStorage } from "@/lib/profileStorage";

/** Shared-device likes only enter an account after an explicit user action. */
export function GuestFavoritesTransfer() {
  const [count,setCount]=useState(0);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  useEffect(()=>{
    const update=()=>setCount(readLikedIds().length);
    update();
    window.addEventListener("food-library-changed",update);
    return ()=>window.removeEventListener("food-library-changed",update);
  },[]);
  async function transfer() {
    if(busy)return;
    const ids=[...new Set(readLikedIds())].filter(id=>id.trim() && id.length<=150).slice(0,30);
    if(!ids.length){setError("Шилжүүлэх боломжтой жор алга.");return;}
    if(!window.confirm("Энэ төхөөрөмж дээр дуртай гэж тэмдэглэсэн жоруудыг таны бүртгэлд нэмэх үү?"))return;
    setBusy(true);setMessage("");setError("");
    try{
      const response=await clientFetch("/likes/import-guest",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({recipe_ids:ids}),
      });
      if(!response.ok)throw new Error("guest_import_failed");
      const data=await response.json() as {accepted_ids?:string[];skipped?:number};
      const accepted=(Array.isArray(data.accepted_ids)?data.accepted_ids:[])
        .filter(id=>ids.includes(id));
      if(accepted.length){
        removeLikedIdsFromStorage(accepted);
        invalidateRecipeLibraryIds("likes");
      }
      setCount(readLikedIds().length);
      setMessage(`${accepted.length} жор бүртгэлд нэмэгдлээ. ${data.skipped??0} жор нийтлэгдээгүй тул төхөөрөмж дээрээ хэвээр үлдлээ.`);
    }catch{
      setError("Дуртай жоруудыг шилжүүлж чадсангүй. Төхөөрөмжийн мэдээлэл устгагдаагүй.");
    }finally{setBusy(false);}
  }
  if(!count && !message && !error)return null;
  return <section className="rounded-2xl border border-[#dce8d6] bg-[#f5faf2] p-4 text-sm">
    {count>0 && <>
      <h2 className="font-bold text-[#295a3c]">Төхөөрөмж дээрх {count} дуртай жор</h2>
      <p className="mt-1 text-xs leading-relaxed text-[#5d7361]">
        Бүртгэлгүй үед тэмдэглэсэн жоруудыг хүсвэл энэ бүртгэлдээ шилжүүлж болно.
        Зөвшөөрөхгүй бол төхөөрөмж дээрээ хэвээр үлдэнэ.
      </p>
      <button type="button" disabled={busy} onClick={()=>void transfer()}
        className="mt-3 min-h-11 rounded-xl bg-[#276440] px-4 font-semibold text-white disabled:opacity-50">
        {busy?"Шилжүүлж байна…":"Дуртай жоруудыг бүртгэлд нэмэх"}
      </button>
    </>}
    {message && <p role="status" className="mt-2 text-xs text-[#276440]">{message}</p>}
    {error && <p role="alert" className="mt-2 text-xs text-amber-900">{error}</p>}
  </section>;
}
