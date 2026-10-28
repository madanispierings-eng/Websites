import type { Metadata, Viewport } from "next";
import { Caveat, Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/env";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap", weight: ["600"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Medivo · Studieplatform voor Leiden Geneeskunde", template: "%s · Medivo" },
  description: site.description,
  applicationName: "Medivo",
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Medivo",
    title: "Medivo · Studieplatform voor Leiden Geneeskunde",
    description: site.description,
    images: [{ url: "/images/leiden-universiteit.webp", width: 1600, height: 1066, alt: "Universiteitsgebouw in Leiden" }],
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} ${caveat.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
