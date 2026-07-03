import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Disable experimental features that may conflict with Vercel builder
  experimental: {
    // Use stable features only
  },
};

export default nextConfig;
