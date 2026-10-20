import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import localFont from "next/font/local";
import { BookingProvider } from "@/components/booking";
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
  weight: ["400", "500"],
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

export const viewport: Viewport = { themeColor: "#f5f5f3" };

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
    <html lang="nl" className={`${clash.variable} ${bodoni.variable}`}>
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
