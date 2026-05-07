import { MobileShell } from "@/components/layout/MobileShell";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell>{children}</MobileShell>;
}
