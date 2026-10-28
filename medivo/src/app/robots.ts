import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (process.env.MEDIVO_NOINDEX === "1") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/account", "/auth", "/dev", "/vakken/*/samenvatting", "/vakken/*/oefenen"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
