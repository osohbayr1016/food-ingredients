"use client";

import { useEffect } from "react";

/** Recover the display wake lock after returning to the cooking screen. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if(!enabled || typeof navigator==="undefined")return;
    let active=true;
    let lock:WakeLockSentinel|null=null;
    async function acquire() {
      if(!active || document.visibilityState!=="visible" || !navigator.wakeLock?.request ||
        (lock && !lock.released)) return;
      try{
        const next=await navigator.wakeLock.request("screen");
        if(!active) await next.release();
        else lock=next;
      }catch{
        // Unsupported browsers, low battery or permission denial are nonfatal.
      }
    }
    function onVisibility(){if(document.visibilityState==="visible")void acquire();}
    document.addEventListener("visibilitychange",onVisibility);
    void acquire();
    return ()=>{
      active=false;
      document.removeEventListener("visibilitychange",onVisibility);
      if(lock)void lock.release().catch(()=>{});
    };
  },[enabled]);
}
