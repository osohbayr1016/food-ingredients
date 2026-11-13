export type StoredCookingTimer={id:string;label:string;endsAt:number};
export type CookingSession={step:number;timers:StoredCookingTimer[]};
/** Restore the matching recipe only; clamp progress and discard corrupt/ancient timers. */
export function restoreCookingSession(
 raw:string|null,recipeId:string,stepCount:number,now=Date.now(),
):CookingSession|null {
 if(!raw)return null;
 try{
   const session=JSON.parse(raw) as {recipeId?:unknown;step?:unknown;timers?:unknown};
   if(!session||session.recipeId!==recipeId)return null;
   const step=typeof session.step==="number" && Number.isSafeInteger(session.step)
     ? Math.min(Math.max(session.step,0),Math.max(0,stepCount-1)):0;
   const timers=Array.isArray(session.timers)?session.timers.slice(0,20).filter(
     (t):t is StoredCookingTimer=>Boolean(t)&&typeof t==="object"&&
       typeof t.id==="string"&&t.id.length>0&&t.id.length<=120&&
       typeof t.label==="string"&&t.label.length>0&&t.label.length<=120&&
       typeof t.endsAt==="number"&&Number.isFinite(t.endsAt)&&
       t.endsAt>=now-5*60_000&&t.endsAt<=now+24*60*60_000,
   ):[];
   return {step,timers};
 }catch{return null;}
}
