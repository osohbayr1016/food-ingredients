export function RecipeEditAlerts({
  err,
  savedMsg,
}: {
  err: string | null;
  savedMsg: string | null;
}) {
  return (
    <>
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </p>
      ) : null}
      {savedMsg ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {savedMsg}
        </p>
      ) : null}
    </>
  );
}
