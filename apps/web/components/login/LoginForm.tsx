"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

const errMsg: Record<string, string> = {
  invalid_credentials: "Нэвтрэх нэр эсвэл нууц үг буруу байна.",
  credentials_required: "Мэдээллээ оруулна уу.",
  login_failed: "Нэвтрэхэд алдаа гарлаа.",
  auth_unavailable:
    "Нэвтрэлтийн өгөгдлийн сантай холбогдож чадсангүй. Системийн админд хэлнэ үү.",
  server_misconfigured: "Серверийн нууц тохиргоо дутуу байна.",
};

export function LoginForm({
  initialNext,
  reason,
}: {
  initialNext?: string;
  reason?: string;
}) {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(username, password);
      const next =
        typeof initialNext === "string" && initialNext.startsWith("/")
          ? initialNext
          : "/profile";
      router.replace(next);
      router.refresh();
    } catch (er) {
      const code = er instanceof Error ? er.message : "";
      setErr(errMsg[code] ?? "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-4 py-6">
      <h2 className="text-center text-lg font-semibold text-zinc-900">Нэвтрэх</h2>
      {reason === "save" ? (
        <p className="text-center text-sm text-zinc-600">
          Хадгалахын тулд <span className="font-semibold text-zinc-900">бүртгэлтэй</span> байх
          шаардлагатай.
        </p>
      ) : reason === "like" ? (
        <p className="text-center text-sm text-zinc-600">
          Дуртай гэж тэмдэглэхийн тулд нэвтэрнэ үү.
        </p>
      ) : (
        <p className="text-center text-sm text-zinc-600">
          Жор үзэхэд бүртгэл хэрэггүй. Хадгалах, дуртай, түүх зэрэгт нэвтэрнэ үү.
        </p>
      )}
      {err ? <p className="text-center text-sm text-red-600">{err}</p> : null}
      <label className="space-y-1 text-sm">
        <span className="text-zinc-500">Хэрэглэгчийн нэр</span>
        <input
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-(--figma-primary)"
          placeholder="jordan_cook"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-zinc-500">Нууц үг</span>
        <input
          required
          type="password"
          autoComplete="current-password"
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
        {busy ? "Түр хүлээнэ үү…" : "Нэвтрэх"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        Бүртгэл байхгүй юу?{" "}
        <Link href="/signup" className="font-semibold text-(--figma-primary) touch-manipulation">
          Бүртгүүлэх
        </Link>
      </p>
      <Link href="/" className="py-2 text-center text-sm text-(--figma-primary) touch-manipulation">
        Нүүр рүү буцах
      </Link>
    </form>
  );
}
