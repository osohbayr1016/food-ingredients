/** Whitelist user-owned offline records. Never export tokens, secrets or device IDs. */
const FIXED_KEYS = new Set([
  "food-ingredients-pantry-v1",
  "food-ingredients-pantry-selection-v1",
  "food_profile","food_liked_recipe_ids","food_body_nutrition_v1",
  "food_ingredients_cook_v1","food-ingredients-week-plan-v1",
]);
const DATE="\\d{4}-\\d{2}-\\d{2}";
const BOUNDED_KEYS = [
  new RegExp(`^food-ingredients-(week-plan-v2|groceries-checked-v2|meal-portions-v1|meal-titles-v1):${DATE}$`),
  /^food_ingredients_cook_v2:[A-Za-z0-9_-]{1,150}:\d{1,2}$/,
  /^ing_ck_v2:[A-Za-z0-9_:-]{1,250}$/,
];
export function portableKey(key:string):boolean{
  if(!key || key.length>300)return false;
  return FIXED_KEYS.has(key) || BOUNDED_KEYS.some(pattern=>pattern.test(key));
}
export type ReadableStorage={length:number;key:(i:number)=>string|null;getItem:(key:string)=>string|null};
export function collectBrowserData(storage:ReadableStorage){
  const result:Record<string,string>={};
  let omitted=0,totalChars=0;
  for(let i=0;i<Math.min(storage.length,500);i++){
    const key=storage.key(i);
    if(!key || !portableKey(key))continue;
    const value=storage.getItem(key);
    if(value===null)continue;
    if(value.length>200000 || totalChars+value.length>1000000){
      omitted++;continue;
    }
    totalChars+=value.length;
    result[key]=value;
  }
  return {records:result,omitted};
}
