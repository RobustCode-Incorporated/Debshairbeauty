// Schema.org JSON-LD builders for Debs Hair Beauty. Real business data
// (address/phone/hours) is mirrored from the constants declared alongside
// the visible "Horaires & Location" section in
// `src/app/[locale]/debs/DebsPageClient.tsx` — keep both in sync if the
// salon's real-world details ever change.
import type { getTranslations } from "next-intl/server";
import { DEBS_CATALOG_SECTIONS } from "@/lib/debs-catalog";
import { DEBS_PRODUCTS } from "@/lib/debs-products";
import { absoluteUrl } from "@/lib/locale-url";

const PHONE = "+32472341968";
const ADDRESS = { streetAddress: "150A Rue de Laeken", postalCode: "1000", addressLocality: "Bruxelles" };

// Tuesday-Saturday, mirroring the HOURS constant in DebsPageClient.tsx (closed Sunday & Monday).
const OPENING_HOURS = [
  { dayOfWeek: "Tuesday", opens: "10:00", closes: "18:00" },
  { dayOfWeek: "Wednesday", opens: "10:00", closes: "19:00" },
  { dayOfWeek: "Thursday", opens: "10:00", closes: "19:00" },
  { dayOfWeek: "Friday", opens: "10:00", closes: "19:30" },
  { dayOfWeek: "Saturday", opens: "10:00", closes: "20:30" },
];

function sameAsLinks(): string[] {
  return [process.env.NEXT_PUBLIC_DEBS_INSTAGRAM_URL, process.env.NEXT_PUBLIC_DEBS_TIKTOK_URL].filter(
    (url): url is string => Boolean(url),
  );
}

/** Base `LocalBusiness` schema — include on every real page (site identity, address, hours, socials). */
export function getLocalBusinessSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": ["HairSalon", "BeautySalon"],
    name: "Debs Hair Beauty",
    image: absoluteUrl("/download (1).webp", locale),
    url: absoluteUrl("/debs", locale),
    telephone: PHONE,
    priceRange: "€€",
    address: { "@type": "PostalAddress", ...ADDRESS, addressCountry: "BE" },
    openingHoursSpecification: OPENING_HOURS.map((h) => ({ "@type": "OpeningHoursSpecification", ...h })),
    sameAs: sameAsLinks(),
  };
}

type Translator = Awaited<ReturnType<typeof getTranslations>>;

/** `LocalBusiness` + full service catalogue (`hasOfferCatalog`) — for `/debs/prestations` only. */
export function getServiceCatalogSchema(locale: string, tCatalogItems: Translator) {
  return {
    ...getLocalBusinessSchema(locale),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Prestations",
      itemListElement: DEBS_CATALOG_SECTIONS.flatMap((section) =>
        section.items.map((item) => ({
          "@type": "Offer",
          url: absoluteUrl("/debs/prestations", locale),
          price: item.priceEuros,
          priceCurrency: "EUR",
          itemOffered: {
            "@type": "Service",
            name: tCatalogItems(item.id),
            category: section.categoryLabel,
          },
        })),
      ),
    },
  };
}

/**
 * `Product` list for the boutique — only non-placeholder items (see
 * `debs-products.ts`): fake placeholder prices must never reach a rich
 * snippet, same guardrail as the purchase API.
 */
export function getProductListSchema(locale: string, tProducts: Translator) {
  const realProducts = DEBS_PRODUCTS.filter((p) => !p.placeholder);
  if (realProducts.length === 0) return null;
  return realProducts.map((product) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: tProducts(`${product.id}.name`),
    image: absoluteUrl(product.image, locale),
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/debs", locale),
      price: product.priceEuros,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  }));
}
