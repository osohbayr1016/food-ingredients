import { SuggestExplorer } from "@/components/suggest/SuggestExplorer";
import { serverGetJson } from "@/lib/serverFetch";
import { Suspense } from "react";

export default async function SuggestPage() {
  type Canon = { canonical_id: string; name: string };
  const catalog = await serverGetJson<{ canonicals: Canon[] }>(
    `/ingredient-catalog`,
  );
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-zinc-500">
          Ачааллаж байна…
        </div>
      }
    >
      <SuggestExplorer canonicals={catalog.canonicals ?? []} />
    </Suspense>
  );
}
