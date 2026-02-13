import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/settings/",
          "/billing/",
          "/onboarding/",
          "/signup/",
          "/migration-dashboard/",
          "/test-migration/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
