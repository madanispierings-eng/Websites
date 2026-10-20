import type { NextConfig } from "next";

// Static export: the `out/` folder can be dropped on Netlify as is.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { optimizePackageImports: ["radix-ui"] },
};

export default nextConfig;
