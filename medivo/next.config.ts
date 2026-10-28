import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Until launch (MEDIVO_LAUNCHED=1, see src/lib/env.ts) unfinished versions stay out of search engines.
if (process.env.MEDIVO_LAUNCHED !== "1") securityHeaders.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["radix-ui", "lucide-react"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
