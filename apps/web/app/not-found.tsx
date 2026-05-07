import Link from "next/link";

export const runtime = "edge";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">Page not found</h1>
      <Link href="/" className="text-[#E23E3E] underline">
        Back home
      </Link>
    </main>
  );
}
