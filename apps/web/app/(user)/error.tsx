"use client";
import Link from "next/link";
export default function UserErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <main role="alert" className="relative z-50 mx-auto max-w-xl space-y-4 px-4 py-14 pb-36 text-center text-zinc-800">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#edf6e8] text-3xl" aria-hidden>!</div>
      <h1 className="text-2xl font-bold text-[#204630]">Мэдээлэл түр ачаалж чадсангүй</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        Холболт түр тасарсан эсвэл сервер ачаалалтай байж болно. Дахин оролдоорой.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset}
          className="min-h-11 rounded-xl bg-[#276440] px-6 text-sm font-semibold text-white">
          Дахин оролдох
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-[#cfe2cb] px-6 text-sm font-semibold text-[#276440]">
          Нүүр хуудас
        </Link>
      </div>
    </main>
  );
}
