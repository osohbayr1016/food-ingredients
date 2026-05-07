import type { Metadata } from "next";
import { AdminChrome } from "@/components/admin/AdminChrome";

export const metadata: Metadata = {
  title: "Admin · Recipe",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AdminChrome>{children}</AdminChrome>
    </div>
  );
}
