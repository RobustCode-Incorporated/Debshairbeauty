import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/locale-url";

// Only the real, indexable pages — see SEO-STRATEGY-DEBS.md for why the
// post-payment confirmation pages are excluded.
const ROUTES: Array<{ pathname: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { pathname: "/debs", changeFrequency: "weekly", priority: 1 },
  { pathname: "/debs/prestations", changeFrequency: "weekly", priority: 0.9 },
  { pathname: "/debs/politique-confidentialite", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap(({ pathname, changeFrequency, priority }) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(pathname, locale),
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages: buildLanguageAlternates(pathname) },
    })),
  );
}
