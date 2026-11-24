import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Tenant subdomains hit the dev server under *.localhost.
  allowedDevOrigins: ["*.localhost"],
};

export default nextConfig;
