import { AuthProvider } from "@/components/auth/AuthContext";
import type { Metadata, Viewport } from "next";
import { Noto_Sans, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const swDevCleanup = `
(function () {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) return;
    return Promise.all(regs.map(function (r) { return r.unregister(); })).then(function () {
      location.reload();
    });
  });
})();`;

const swProdRegister = `
(function () {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  navigator.serviceWorker.register("/sw.js").catch(function () {});
})();`;

const geistSans = Noto_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://food-ingredients-web.osohoo691016.workers.dev"),
  title: { default: "Food Ingredients — Өнөөдөр юу идэх вэ?", template: "%s | Food Ingredients" },
  description: "Хөргөгчийн орцоороо хоол олоорой. Монгол хэл дээрх жор, алхамчилсан заавар, хоолны төлөвлөгөө.",
  openGraph: {
    type: "website",
    locale: "mn_MN",
    title: "Food Ingredients — Өнөөдөр юу идэх вэ?",
    description: "Орцоо сонгоод тохирох хоолоо олоорой.",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: "#173f30",
};

export const dynamic = "force-dynamic";

export const runtime = "edge";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900`}
      >
        {process.env.NODE_ENV === "production" ? (
          <Script id="sw-register" strategy="afterInteractive">
            {swProdRegister}
          </Script>
        ) : (
          <Script id="sw-dev-cleanup" strategy="beforeInteractive">
            {swDevCleanup}
          </Script>
        )}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
