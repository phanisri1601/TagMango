import type { NextConfig } from "next";

const PRIVATE = ["/admin/:path*", "/admin", "/reviewer", "/web/:path*", "/login", "/signup/:path*", "/signup", "/api/:path*", "/invoice/:path*", "/portal"];

const nextConfig: NextConfig = {
  // Lets a second dev server (e.g. an automated test run) use its own build folder instead of corrupting .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,

  // Clean public addresses. The pages themselves still live under /web.
  async redirects() {
    return [
      { source: "/web/login", destination: "/login", permanent: true },
      { source: "/web/sign-up", destination: "/signup", permanent: true },
      { source: "/web/sign-up/about", destination: "/signup/about", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/login", destination: "/web/login" },
      { source: "/signup", destination: "/web/sign-up" },
      { source: "/signup/about", destination: "/web/sign-up/about" },
      { source: "/admin/login", destination: "/web/login?as=admin" },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      // Private areas never appear in search engines and are and the admin and reviewer pages are never cached by shared caches.
      ...PRIVATE.map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
      ...["/admin/:path*", "/admin", "/reviewer"].map((source) => ({ source, headers: [{ key: "Cache-Control", value: "private, no-store" }] })),
    ];
  },
};

export default nextConfig;
