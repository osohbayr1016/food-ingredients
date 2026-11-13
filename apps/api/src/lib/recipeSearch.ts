/** Deterministic search synonyms; canonical aliases in D1 are checked separately. */
const GROUPS = [
  ["тахиа","тахианы мах","tahia","tahianii mah","chicken"],
  ["өндөг","ondog","undug","egg","eggs"],
  ["төмс","tums","toms","potato","potatoes"],
  ["лууван","luuvan","carrot"],
  ["сонгино","songino","onion"],
  ["будаа","budaa","rice"],
  ["гоймон","goimon","noodle","noodles","pasta"],
  ["үхрийн мах","uhriin mah","beef"],
  ["гахайн мах","gahain mah","pork"],
  ["загас","zagas","fish"],
  ["шөл","shul","shol","soup"],
  ["салат","salat","salad"],
  ["мөөг","moog","mushroom"],
  ["сүү","suu","milk"],
  ["бяслаг","byaslag","cheese"],
  ["гурил","guril","flour"],
  ["байцаа","baitsaa","cabbage"],
  ["давс","davs","salt"],
  ["чинжүү","chinjúú","chinjuu","pepper"],
  ["сармис","sarmis","garlic"],
  ["брокколи","broccoli"],
  ["уураг","uurag","protein"],
] as const;

export function expandRecipeSearch(query: string): string[] {
  const q = query.trim().toLowerCase().replace(/\s+/g," ").slice(0,100);
  if (!q) return [];
  const group = GROUPS.find(values => values.includes(q as never));
  return [...new Set([q,...(group ?? [])])].slice(0,6);
}

/** Escape SQL LIKE wildcards so typing 100% is not a global search. */
export function likePattern(term: string): string {
  return "%" + term.replace(/[\\%_]/g, "\\$&") + "%";
}
