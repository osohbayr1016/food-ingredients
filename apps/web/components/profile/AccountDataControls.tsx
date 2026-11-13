"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { clientFetch } from "@/lib/clientApi";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountDataControls({username}:{username:string}) {
  const {logout}=useAuth();
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [password,setPassword]=useState("");
  const [confirmation,setConfirmation]=useState("");
  const [showDelete,setShowDelete]=useState(false);

  async function exportData() {
    if(busy) return;
    setBusy(true);setError("");setSuccess("");
    try {
      const res=await clientFetch("/me/export",{cache:"no-store"});
      if(!res.ok) throw new Error("export_failed");
      const data=await res.text();
      const blob=new Blob([data],{type:"application/json;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=`food-ingredients-${username}-data.json`;
      document.body.appendChild(a);a.click();a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),5000);
      setSuccess("Хувийн өгөгдлийг JSON файлаар татлаа. Файлыг аюулгүй хадгалаарай.");
    }catch{
      setError("Мэдээлэл татаж чадсангүй. Холболтоо шалгаад дахин оролдоорой.");
    }finally{setBusy(false);}
  }

  async function deleteNutrition(){
    if(busy || !window.confirm("Шим тэжээл, биеийн үзүүлэлтийн мэдээллээ бүртгэлээс бүр мөсөн устгах уу?")) return;
    setBusy(true);setError("");setSuccess("");
    try{
      const res=await clientFetch("/me/nutrition",{method:"DELETE"});
      if(!res.ok) throw new Error("nutrition_delete_failed");
      window.dispatchEvent(new Event("food-nutrition-changed"));
      setSuccess("Бүртгэл дээрх шим тэжээлийн мэдээллийг устгалаа.");
    }catch{setError("Шим тэжээлийн мэдээллийг устгаж чадсангүй.");}
    finally{setBusy(false);}
  }

  async function revokeAll(){
    if(busy || !window.confirm("Бүх төхөөрөмж дээрх нэвтрэлтийг хүчингүй болгож гарах уу?")) return;
    setBusy(true);setError("");setSuccess("");
    try{
      const res=await clientFetch("/auth/revoke-all",{method:"POST"});
      if(!res.ok) throw new Error("revoke_failed");
      logout();
      router.replace("/");
    }catch{setError("Бүх төхөөрөмжөөс гарч чадсангүй. Дахин оролдоорой.");}
    finally{setBusy(false);}
  }

  async function deleteAccount(){
    if(busy || confirmation.trim().toLowerCase()!==username.toLowerCase() || !password) return;
    if(!window.confirm("Бүртгэл болон сервер дээрх хадгалсан бүх мэдээллийг буцаах боломжгүйгээр устгах уу?")) return;
    setBusy(true);setError("");setSuccess("");
    try{
      const res=await clientFetch("/me/account",{
        method:"DELETE",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({password,confirm_username:confirmation.trim()}),
      });
      if(!res.ok){
        const data=await res.json().catch(()=>({})) as {error?:string};
        if(data.error==="invalid_password") setError("Нууц үг буруу байна.");
        else if(data.error==="admin_account_deletion_not_supported") setError("Админ бүртгэлийг энэ хэсгээс устгах боломжгүй.");
        else setError("Бүртгэлийг устгаж чадсангүй. Дахин оролдоорой.");
        return;
      }
      setPassword("");setConfirmation("");
      logout();
      router.replace("/");
    }catch{setError("Холболтын алдаа гарлаа. Бүртгэл устсан эсэхийг дахин шалгаарай.");}
    finally{setBusy(false);}
  }

  return <details className="rounded-2xl border border-[#e0e9dc] bg-white p-4">
    <summary className="cursor-pointer text-sm font-bold text-[#276440]">Хувийн мэдээлэл ба бүртгэлийн удирдлага</summary>
    <div className="mt-4 space-y-5 text-sm">
      <div className="space-y-2">
        <p className="text-[#66786b]">Бүртгэлд хадгалсан хоолны түүх, дуртай жор, шим тэжээл болон cloud орцоо татаж авна.</p>
        <button type="button" disabled={busy} onClick={()=>void exportData()}
          className="min-h-11 rounded-xl bg-[#edf6e8] px-4 font-semibold text-[#276440] disabled:opacity-50">Мэдээллээ татах (JSON)</button>
      </div>
      <div className="space-y-2 border-t border-[#ecf0e9] pt-4">
        <p className="font-semibold text-[#294a34]">Шим тэжээлийн мэдээллээ арилгах</p>
        <p className="text-xs text-[#6d7f70]">Биеийн жин, нас, өндөр, хооллолтын зорилгыг серверээс устгана. Бусад жор хэвээр байна.</p>
        <button type="button" disabled={busy} onClick={()=>void deleteNutrition()}
          className="min-h-11 rounded-xl border border-[#dbe5d8] px-4 font-semibold text-[#276440] disabled:opacity-50">Шим тэжээлийн мэдээлэл устгах</button>
      </div>
      <div className="space-y-2 border-t border-[#ecf0e9] pt-4">
        <p className="font-semibold text-[#294a34]">Бүх төхөөрөмжөөс гарах</p>
        <button type="button" disabled={busy} onClick={()=>void revokeAll()}
          className="min-h-11 rounded-xl border border-[#dbe5d8] px-4 font-semibold text-[#276440] disabled:opacity-50">Бүх төхөөрөмжийн нэвтрэлтийг цуцлах</button>
      </div>
      <div className="space-y-3 border-t border-[#f0dddd] pt-4">
        <button type="button" onClick={()=>setShowDelete(value=>!value)} aria-expanded={showDelete}
          className="min-h-11 text-sm font-semibold text-rose-800 underline underline-offset-4">
          {showDelete?"Бүртгэл устгах хэсгийг хаах":"Бүртгэлээ бүр мөсөн устгах"}
        </button>
        {showDelete && <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs text-rose-900">Сервер дээрх бүртгэл, хадгалсан/дуртай жор, түүх, шим тэжээл болон cloud орц устна. Энэ төхөөрөмж дээрх тусдаа local өгөгдөл автоматаар арилдаггүй.</p>
          <label className="block text-xs font-semibold text-rose-900">Бүртгэлийн нэрийг яг бичнэ үү: {username}
            <input value={confirmation} onChange={e=>setConfirmation(e.target.value)}
              autoComplete="off" className="mt-1 min-h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-base text-zinc-900"/>
          </label>
          <label className="block text-xs font-semibold text-rose-900">Одоогийн нууц үг
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              autoComplete="current-password" className="mt-1 min-h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-base text-zinc-900"/>
          </label>
          <button type="button" disabled={busy || !password || confirmation.trim().toLowerCase()!==username.toLowerCase()}
            onClick={()=>void deleteAccount()}
            className="min-h-11 rounded-xl bg-rose-700 px-4 font-bold text-white disabled:opacity-40">
            {busy?"Шалгаж байна…":"Бүртгэлийг бүр мөсөн устгах"}
          </button>
        </div>}
      </div>
      {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">{error}</p>}
      {success && <p role="status" className="rounded-xl bg-[#edf6e8] p-3 text-[#276440]">{success}</p>}
    </div>
  </details>;
}
