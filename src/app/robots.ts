import type { MetadataRoute } from "next";
import { DEBS_SITE_URL } from "@/lib/locale-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Post-payment thank-you pages: no evergreen content, never linked
      // from another page, so no indexing value — see SEO-STRATEGY-DEBS.md.
      disallow: ["/api/", "/debs/commande-confirmee", "/debs/reservation-confirmee"],
    },
    sitemap: `${DEBS_SITE_URL}/sitemap.xml`,
  };
}
