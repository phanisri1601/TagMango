import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a second dev server (e.g. an automated test run) use its own build folder instead of corrupting .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
