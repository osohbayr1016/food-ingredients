"use client";

import { collectBrowserData } from "@/lib/browserDataExport";
import { useState } from "react";

export function BrowserDataExport(){
  const [status,setStatus]=useState("");
  function download(){
    try{
      const result=collectBrowserData(localStorage);
      const data={format_version:1,exported_at:new Date().toISOString(),
        description:"Food Ingredients — this browser's local-only data, no account or token",
        records:result.records};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;
      link.download="food-ingredients-this-device.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setStatus(`${Object.keys(result.records).length} мэдээллийн бичлэг татагдлаа.${result.omitted ? ` ${result.omitted} хэт том бичлэг ороогүй.` : ""}`);
    }catch{
      setStatus("Төхөөрөмжийн мэдээллийг татаж чадсангүй. Browser хадгалах эрхийг шалгаарай.");
    }
  }
  return <details className="rounded-2xl border border-[#e0e9dc] bg-white p-4">
    <summary className="cursor-pointer text-sm font-bold text-[#276440]">Энэ төхөөрөмжийн мэдээлэл</summary>
    <div className="space-y-3 pt-4 text-sm">
      <p className="text-[#637767]">Гэрийн орц, долоо хоногийн төлөвлөгөө, дуртай жор болон хадгалсан хооллолтын мэдээллээ JSON файл болгон авна. Нууц үг болон нэвтрэлтийн токен файлд орохгүй.</p>
      <p className="text-xs leading-relaxed text-amber-800">
        Файлд таны жин, нас болон хооллолтын зорилго агуулагдаж болно. Хувийн төхөөрөмж дээрээ аюулгүй хадгална уу.
      </p>
      <button type="button" onClick={download}
        className="min-h-11 rounded-xl bg-[#edf6e8] px-4 font-semibold text-[#276440]">
        Төхөөрөмжийн мэдээлэл татах
      </button>
      {status && <p role="status" className="text-xs text-[#44664a]">{status}</p>}
    </div>
  </details>;
}
