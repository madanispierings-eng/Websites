import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "kopen/", "verkopen/", "advies/", "kosten/", "over-ons/", "inzichten/", "vragen/", "contact/", "privacy/"];
  return [
    ...pages.map((p) => ({ url: `${site.url}/${p}` })),
    ...articles.map((a) => ({ url: `${site.url}/inzichten/${a.slug}/` })),
  ];
}
