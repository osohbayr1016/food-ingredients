"use client";

export default function UserErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="relative z-50 mx-auto max-w-xl space-y-3 px-4 py-10 pb-36 text-sm text-zinc-800">
      <p className="font-semibold text-zinc-900">Something went wrong.</p>
      <pre className="whitespace-pre-wrap text-xs text-red-600">{error.message}</pre>
      <button
        type="button"
        onClick={() => reset()}
        className="relative z-[60] rounded-full bg-(--figma-primary) px-4 py-2 text-sm font-semibold text-white touch-manipulation"
      >
        Try again
      </button>
    </div>
  );
}
