import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/layout/site-header";
import { Cursor } from "@/components/motion/cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
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

// Before first paint: the home opening starts with its parts out of sight. Lifted after four seconds whatever happens,
// so the page is never left empty when a script fails.
const introScript = `(function(){try{var d=document.documentElement;if(location.pathname==="/"&&scrollY<40&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro");setTimeout(function(){d.classList.remove("intro")},4000)}}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${clash.variable} ${bodoni.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SmoothScroll />
        <Cursor />
      </body>
    </html>
  );
}
