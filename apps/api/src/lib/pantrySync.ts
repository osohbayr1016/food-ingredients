export type AccountPantryItem = {
  canonical_id: string; name: string; quantity: string; unit: string; expires_on: string;
};

function dateOk(value: string): boolean {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const [year,month,day]=value.split("-").map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year && date.getUTCMonth()===month-1 && date.getUTCDate()===day;
}

/** Reject malformed writes instead of silently deleting user pantry items. */
export function parseAccountPantry(value: unknown): AccountPantryItem[] | null {
  if (!Array.isArray(value) || value.length>100) return null;
  const seen=new Set<string>();
  const items: AccountPantryItem[]=[];
  for (const raw of value) {
    if (!raw || typeof raw!=="object" || Array.isArray(raw)) return null;
    const x=raw as Record<string,unknown>;
    if (typeof x.canonical_id!=="string" || typeof x.name!=="string" ||
        typeof x.unit!=="string" || typeof x.expires_on!=="string" ||
        typeof x.quantity!=="string") return null;
    const id=x.canonical_id.trim(), name=x.name.trim();
    const qty=x.quantity.trim(), unit=x.unit.trim(), expires=x.expires_on.trim();
    const amount=Number(qty);
    if (!id || id.length>120 || !name || name.length>120 || seen.has(id) ||
        unit.length>40 || (qty!=="" && (!Number.isFinite(amount) || amount<=0 || amount>100000)) ||
        (expires!=="" && !dateOk(expires))) return null;
    seen.add(id);
    items.push({canonical_id:id,name,quantity:qty,unit,expires_on:expires});
  }
  return items;
}

export function validPantryRevision(value: unknown): value is number {
  return typeof value==="number" && Number.isSafeInteger(value) && value>=0 && value<1000000000;
}
