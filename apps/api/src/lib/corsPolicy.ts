/** Only explicitly configured browser origins can read cross-origin responses. */
export function allowedCorsOrigin(origin:string|undefined,setting:string|undefined):string|null{
 if(!origin || origin==="null")return null;
 const allowed=(setting??"").split(",").map(x=>x.trim()).filter(Boolean);
 return allowed.includes(origin)?origin:null;
}
