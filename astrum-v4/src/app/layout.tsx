import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Cursor } from "@/components/motion/cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { site } from "@/lib/content";
import "./globals.css";

// General Sans (Indian Type Foundry, via Fontshare, free for commercial use), self-hosted.
const general = localFont({
  src: [
    { path: "../fonts/general-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/general-sans-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-general",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Astrum · Vastgoed in Dubai, voor wie verder kijkt", template: "%s · Astrum" },
  description:
    "Astrum is een boutique makelaar in Dubai voor Nederlanders. Kopen, verkopen en advies met echte transactieprijzen en één vast Nederlandstalig aanspreekpunt.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#faf9f6" };

// Before first paint: the home opening starts with its parts out of sight. Lifted after four seconds whatever happens,
// so the page is never left empty when a script fails.
const introScript = `(function(){try{var d=document.documentElement;if(location.pathname==="/"&&scrollY<40&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro");setTimeout(function(){d.classList.remove("intro")},4000)}}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={general.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <SmoothScroll />
        <Cursor />
      </body>
    </html>
  );
}
