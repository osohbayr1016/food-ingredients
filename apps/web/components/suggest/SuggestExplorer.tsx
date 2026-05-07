"use client";

import { SuggestFeatureIntro } from "@/components/suggest/SuggestFeatureIntro";
import { SuggestResults } from "@/components/suggest/SuggestResults";
import { useSuggestPantryUrl } from "@/components/suggest/useSuggestPantryUrl";

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium touch-manipulation ${
        active
          ? "border-(--figma-primary) bg-(--figma-primary) text-white"
          : "border-zinc-200 bg-white text-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

export function SuggestExplorer({
  canonicals,
}: {
  canonicals: { canonical_id: string; name: string }[];
}) {
  const { active, busy, rows, toggle, suggest } =
    useSuggestPantryUrl(canonicals);

  return (
    <div className="space-y-4 py-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
          Гар дээрх материал — Pantry match
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">Тохирох жор олох</h1>
        <p className="text-sm text-zinc-500">
          Гар дээр байгаа орцоо сонгоод, таны ногоонд тохирох боломжит хоолыг харна.
        </p>
      </header>
      <SuggestFeatureIntro />
      <div className="flex flex-wrap gap-2">
        {canonicals.map((c) => (
          <Chip
            key={c.canonical_id}
            active={active.has(c.canonical_id)}
            label={c.name}
            onClick={() => toggle(c.canonical_id)}
          />
        ))}
      </div>
      <button
        type="button"
        disabled={busy || !active.size}
        onClick={() => suggest()}
        className="w-full rounded-2xl bg-(--figma-primary) py-3 font-semibold text-white disabled:opacity-40 touch-manipulation"
      >
        {busy ? "Тооцоолж байна…" : "Жор санал болгох"}
      </button>
      <SuggestResults rows={rows} />
    </div>
  );
}
