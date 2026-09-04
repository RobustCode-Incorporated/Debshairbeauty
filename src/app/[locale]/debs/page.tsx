import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/locale-url";
import { getLocalBusinessSchema, getProductListSchema } from "@/lib/debs-schema";
import { getGoogleReviews } from "@/lib/debs-google-reviews";
import DebsPageClient from "./DebsPageClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("debs.title"),
    description: t("debs.description"),
    alternates: {
      canonical: absoluteUrl("/debs", locale),
      languages: buildLanguageAlternates("/debs"),
    },
  };
}

export default async function DebsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tProducts = await getTranslations({ locale, namespace: "Products" });
  const products = getProductListSchema(locale, tProducts);
  const reviews = await getGoogleReviews();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessSchema(locale)) }} />
      {products?.map((product, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />
      ))}
      <DebsPageClient reviews={reviews} />
    </>
  );
}
