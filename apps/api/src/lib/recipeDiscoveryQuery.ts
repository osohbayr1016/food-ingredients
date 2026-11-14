export type DiscoveryParams = {
  cuisine?: string;
  tag?: string;
  query?: string;
};
export type ParsedDiscovery =
  | {ok:true; value: DiscoveryParams}
  | {ok:false; error: "invalid_cuisine" | "invalid_tag" | "invalid_query"};

/** Exact facets must be bounded; long queries should not be silently truncated. */
export function parseRecipeDiscoveryParams(raw: {
  cuisine?: string;
  tag?: string;
  q?: string;
}): ParsedDiscovery {
  function facet(value: string | undefined, max: number) {
    if (value === undefined) return undefined;
    const trimmed=value.trim();
    if (trimmed.length>max || /[\u0000-\u001F\u007F]/.test(value)) return null;
    return trimmed || undefined;
  }
  const cuisine=facet(raw.cuisine,80);
  if (cuisine===null) return {ok:false,error:"invalid_cuisine"};
  const tag=facet(raw.tag,80);
  if (tag===null) return {ok:false,error:"invalid_tag"};
  const query=facet(raw.q,100);
  if (query===null) return {ok:false,error:"invalid_query"};
  return {ok:true,value:{cuisine,tag,query:query?.toLowerCase()}};
}
