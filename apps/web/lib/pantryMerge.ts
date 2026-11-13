import { normalizePantry, type PantryInventoryItem } from "./pantryInventory";

/** Keeps device edits on duplicate IDs, never guesses which quantity is fresher. */
export function mergePantryInventories(local: PantryInventoryItem[], remote: PantryInventoryItem[]) {
  const current=normalizePantry(local);
  const cloud=normalizePantry(remote);
  const merged=[...current];
  const existing=new Map(current.map(item=>[item.canonical_id,item]));
  const conflicts:string[]=[];
  const omitted:string[]=[];
  let added=0;
  for(const item of cloud) {
    const match=existing.get(item.canonical_id);
    if(match) {
      if(match.name!==item.name || match.quantity!==item.quantity ||
        match.unit!==item.unit || match.expires_on!==item.expires_on) conflicts.push(item.name);
      continue;
    }
    if(merged.length>=100) {omitted.push(item.name);continue;}
    merged.push(item);
    existing.set(item.canonical_id,item);
    added++;
  }
  return {items:merged,added,conflicts,omitted};
}
