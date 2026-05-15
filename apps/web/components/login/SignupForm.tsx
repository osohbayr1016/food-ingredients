"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

const errMsg: Record<string, string> = {
  invalid_username:
    "3–32 тэмдэгт, зөвхөн латин үсэг, тоо, доогур зураас.",
  weak_password: "Нууц үг дор хаяж 8 тэмдэгт байна.",
  username_taken: "Энэ хэрэглэгчийн нэр аль хэдийн бүртгэлтэй (давтагдашгүй).",
  register_failed: "Бүртгэл үүсгэхэд алдаа гарлаа.",
  auth_unavailable:
    "Нэвтрэлтийн өгөгдлийн сантай холбогдож чадсангүй. Системийн админд хэлнэ үү.",
  server_misconfigured: "Серверийн нууц тохиргоо дутуу байна.",
};

export function SignupForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await register(username, password);
      router.replace("/profile");
      router.refresh();
    } catch (er) {
      const code = er instanceof Error ? er.message : "";
      setErr(errMsg[code] ?? "Алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-4 py-6">
      <h2 className="text-center text-lg font-semibold text-zinc-900">Бүртгүүлэх</h2>
      {err ? <p className="text-center text-sm text-red-600">{err}</p> : null}
      <label className="space-y-1 text-sm">
        <span className="text-zinc-500">Хэрэглэгчийн нэр</span>
        <input
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-(--figma-primary)"
          placeholder="latin_letters_123"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-zinc-500">Нууц үг (дор хаяж 8)</span>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-(--figma-primary)"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-2xl bg-(--figma-primary) py-3 text-sm font-semibold text-white disabled:opacity-50 touch-manipulation"
      >
        {busy ? "Үүсгэж байна…" : "Бүртгүүлэх"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        Аль хэдийн бүртгэлтэй?{" "}
        <Link href="/login" className="font-semibold text-(--figma-primary) touch-manipulation">
          Нэвтрэх
        </Link>
      </p>
    </form>
  );
}
