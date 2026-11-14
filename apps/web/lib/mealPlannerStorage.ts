/** Constrain untrusted historical localStorage values before rendering or syncing. */
const SLOT=/^[0-6]\|(breakfast|lunch|dinner)$/;
const ID=/^[A-Za-z0-9_-]{1,150}$/;
function entries(raw:unknown):[string,unknown][] {
  if (!raw || typeof raw!=="object" || Array.isArray(raw))return [];
  return Object.entries(raw).slice(0,1000);
}
export function parsePlannerStorage(raw:string|null):unknown {
  if(!raw || raw.length>128*1024)return {};
  try{return JSON.parse(raw) as unknown;}catch{return {};}
}
export function cleanPlannerSelections(raw:unknown):Record<string,string> {
  return Object.fromEntries(entries(raw)
    .filter(([key,val])=>SLOT.test(key) && typeof val==="string" &&
      (val==="" || ID.test(val))).slice(0,21)) as Record<string,string>;
}
export function cleanPlannerPortions(raw:unknown):Record<string,number> {
  return Object.fromEntries(entries(raw)
    .filter(([key,val])=>SLOT.test(key) && typeof val==="number" &&
      Number.isSafeInteger(val) && val>=1 && val<=30).slice(0,21)) as Record<string,number>;
}
export function cleanPlannerChecked(raw:unknown):Record<string,boolean> {
  return Object.fromEntries(entries(raw)
    .filter(([key,val])=>key.length>0 && key.length<=250 &&
      !Array.from(key).some(c=>c.charCodeAt(0)<32 || c.charCodeAt(0)===127) &&
      typeof val==="boolean").slice(0,250)) as Record<string,boolean>;
}
export function cleanPlannerTitles(raw:unknown):Record<string,string> {
  return Object.fromEntries(entries(raw)
    .filter(([key,val])=>ID.test(key) && typeof val==="string" &&
      val.trim().length>0 && val.length<=160).slice(0,100)) as Record<string,string>;
}
