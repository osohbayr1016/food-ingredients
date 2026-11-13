/** Deterministic, conservative starter plan; never makes health or allergy guarantees. */
export type QuickRecipe={id:string;title:string;cuisine:string;prep_time:number;cook_time:number;difficulty:number};
export type QuickPlanResult={plan:Record<string,string>;added:number;eligible:number};
export function fillQuickDinners(
 recipes:QuickRecipe[], existing:Record<string,string>, weekStart:string,
):QuickPlanResult {
 const plan={...existing};
 const used=new Set(Object.values(plan).filter(Boolean));
 const eligible=recipes.filter(r=>r.id && r.title && Number.isFinite(r.prep_time) &&
   Number.isFinite(r.cook_time) && r.prep_time+r.cook_time>0 &&
   r.prep_time+r.cook_time<=45 && Number.isInteger(r.difficulty) && r.difficulty<=2);
 const unique=[...new Map(eligible.map(r=>[r.id,r])).values()].filter(r=>!used.has(r.id));
 // Rotate across weeks rather than always suggesting the same starting recipe.
 const rotation=[...weekStart].reduce((sum,ch)=>sum+ch.charCodeAt(0),0) % Math.max(unique.length,1);
 const choices=[...unique.slice(rotation),...unique.slice(0,rotation)];
 let added=0;let priorCuisine="";
 for(let day=0;day<7;day++){
   const key=`${day}|dinner`;
   if(plan[key])continue;
   if(!choices.length)break;
   let index=choices.findIndex(r=>r.cuisine!==priorCuisine);
   if(index<0) index=0;
   const [picked]=choices.splice(index,1);
   plan[key]=picked.id;used.add(picked.id);added++;priorCuisine=picked.cuisine;
 }
 return {plan,added,eligible:eligible.length};
}
/** Bounded parallel requests reduce network contention on slower phones. */
export async function mapBounded<T,R>(
  values:readonly T[], parallel:number, task:(value:T,index:number)=>Promise<R>,
):Promise<R[]> {
 if(!Number.isSafeInteger(parallel)||parallel<1||parallel>32)throw Error("invalid_parallelism");
 const result=new Array<R>(values.length);let cursor=0;
 async function worker() {
   while(cursor<values.length){
     const i=cursor++;
     result[i]=await task(values[i],i);
   }
 }
 await Promise.all(Array.from({length:Math.min(parallel,values.length)},()=>worker()));
 return result;
}
