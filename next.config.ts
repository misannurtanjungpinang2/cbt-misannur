import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark pdf-parse as external to avoid webpack bundling issues
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
