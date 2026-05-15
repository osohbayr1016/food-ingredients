import { SuggestExplorer } from "@/components/suggest/SuggestExplorer";
import { Suspense } from "react";

export default async function SuggestPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-zinc-500">
          Ачааллаж байна…
        </div>
      }
    >
      <SuggestExplorer />
    </Suspense>
  );
}
