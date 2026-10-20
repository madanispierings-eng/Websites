import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/layout/site-header";
import { site } from "@/lib/content";
import "./globals.css";

const clash = localFont({
  src: [
    { path: "../fonts/clash-grotesk-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/clash-grotesk-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-clash",
  display: "swap",
});

// Variable, with the optical-size axis: the hairlines stay fine at large sizes.
const bodoni = Bodoni_Moda({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bodoni", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Astrum · Vastgoed in Dubai, voor wie verder kijkt",
  description:
    "Astrum is een boutique makelaar in Dubai voor Nederlanders. Kopen, verkopen en advies met echte transactieprijzen en één vast Nederlandstalig aanspreekpunt.",
};

export const viewport: Viewport = { themeColor: "#10261b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${clash.variable} ${bodoni.variable}`} suppressHydrationWarning>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
