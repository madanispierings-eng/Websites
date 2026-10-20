import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import localFont from "next/font/local";
import { BookingProvider } from "@/components/booking";
import { Cursor } from "@/components/cursor";
import { Motion } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import "./globals.css";

const clash = localFont({
  src: [
    { path: "../fonts/clash-grotesk-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/clash-grotesk-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-clash",
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  // variable, with the optical-size axis: the hairlines stay fine at monument size
  axes: ["opsz"],
  style: ["normal"],
  variable: "--font-bodoni",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Astrum · Boutique makelaar in Dubai voor Nederlanders", template: "%s · Astrum" },
  description:
    "Astrum is een boutique makelaar in Dubai voor Nederlanders. Kopen, verkopen en advies met echte transactieprijzen en één vast Nederlandstalig aanspreekpunt.",
  icons: { icon: "/favicon.svg" },
  openGraph: { type: "website", locale: "nl_NL", siteName: "Astrum", images: ["/img/duo.jpg"] },
};

export const viewport: Viewport = { themeColor: "#f2efe8" };

// Before first paint: the home hero's opening starts with its parts out of sight. Lifted after four seconds whatever
// happens, so the page is never left empty when a script fails.
const introScript = `(function(){try{var d=document.documentElement;if(location.pathname==="/"&&scrollY<40&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro");setTimeout(function(){d.classList.remove("intro")},4000)}}catch(e){}})()`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: site.name,
  url: site.url,
  email: site.email,
  areaServed: "Dubai",
  address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
  sameAs: [site.instagram, site.linkedin],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${clash.variable} ${bodoni.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <link rel="preload" as="image" href="/img/night-1600.jpg" imageSrcSet="/img/night-960.jpg 960w, /img/night-1600.jpg 1600w, /img/night-2560.jpg 2560w" imageSizes="(max-width: 767px) 172vh, (max-aspect-ratio: 3/2) 150vh, 100vw" />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 bg-gold px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Naar de inhoud
        </a>
        <BookingProvider>
          <SiteHeader />
          <main id="main">
            <Motion>{children}</Motion>
          </main>
          <SiteFooter />
        </BookingProvider>
        <Cursor />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
