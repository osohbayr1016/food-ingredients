import { SuggestExplorer } from "@/components/suggest/SuggestExplorer";
import { serverGetJson } from "@/lib/serverFetch";

export default async function SuggestPage() {
  type Canon = { canonical_id: string; name: string };
  const catalog = await serverGetJson<{ canonicals: Canon[] }>(
    `/ingredient-catalog`,
  );
  return <SuggestExplorer canonicals={catalog.canonicals ?? []} />;
}
