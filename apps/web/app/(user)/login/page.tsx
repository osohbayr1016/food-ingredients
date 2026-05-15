import { LoginForm } from "@/components/login/LoginForm";

export default async function LoginPage(props: {
  searchParams?: Promise<{ next?: string; reason?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  return (
    <div className="mx-auto max-w-md px-4">
      <h1 className="pt-8 text-center text-2xl font-bold text-zinc-900">Нэвтрэх</h1>
      <LoginForm initialNext={sp.next} reason={sp.reason} />
    </div>
  );
}
