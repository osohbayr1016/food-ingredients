import { AuthProvider } from "@/components/auth/AuthContext";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Ingredients",
  description: "Recipe browser, cooking mode, and pantry matching",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: "#E23E3E",
};

export const dynamic = "force-dynamic";

export const runtime = "edge";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
