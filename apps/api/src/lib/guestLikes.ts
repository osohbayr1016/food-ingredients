/** Bounded guest favorites transfer. Never use user-supplied IDs in raw SQL. */
export function parseGuestLikeIds(value:unknown):string[]|null{
 if(!Array.isArray(value)||value.length<1||value.length>30)return null;
 const ids:string[]=[];
 const seen=new Set<string>();
 for(const raw of value){
   if(typeof raw!=="string")return null;
   const id=raw.trim();
   if(!/^[a-zA-Z0-9_-]{1,150}$/.test(id))return null;
   if(!seen.has(id)){ids.push(id);seen.add(id);}
 }
 return ids;
}
