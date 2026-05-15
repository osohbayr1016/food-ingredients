import { SignupForm } from "@/components/login/SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4">
      <h1 className="pt-8 text-center text-2xl font-bold text-zinc-900">Бүртгэл</h1>
      <SignupForm />
    </div>
  );
}
