import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/locale-url";
import { getServiceCatalogSchema } from "@/lib/debs-schema";
import DebsPrestationsPageClient from "./DebsPrestationsPageClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("prestations.title"),
    description: t("prestations.description"),
    alternates: {
      canonical: absoluteUrl("/debs/prestations", locale),
      languages: buildLanguageAlternates("/debs/prestations"),
    },
  };
}

export default async function DebsPrestationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tCatalogItems = await getTranslations({ locale, namespace: "CatalogItems" });
  const schema = getServiceCatalogSchema(locale, tCatalogItems);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <DebsPrestationsPageClient />
    </>
  );
}
