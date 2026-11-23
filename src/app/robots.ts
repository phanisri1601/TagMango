import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/reviewer", "/web/", "/login", "/signup", "/api/", "/invoice/", "/portal", "/checkout/"] }] };
}
