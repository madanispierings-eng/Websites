import type { MetadataRoute } from "next";
import { getCourses } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getCourses();
  const pages = ["", "/vakken", "/over-ons", "/veelgestelde-vragen", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    // Public course pages only; summaries and practice are premium and kept out of the index.
    ...courses.flatMap((c) => [
      { url: `${siteUrl}/vakken/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 },
      { url: `${siteUrl}/vakken/${c.slug}/leerdoelen`, changeFrequency: "monthly" as const, priority: 0.5 },
      { url: `${siteUrl}/vakken/${c.slug}/tentamens`, changeFrequency: "monthly" as const, priority: 0.5 },
    ]),
  ];
}
