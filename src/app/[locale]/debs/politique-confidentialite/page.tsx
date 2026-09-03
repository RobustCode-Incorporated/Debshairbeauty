import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/locale-url";
import DebsPrivacyPolicyPageClient from "./DebsPrivacyPolicyPageClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("privacyPolicy.title"),
    description: t("privacyPolicy.description"),
    alternates: {
      canonical: absoluteUrl("/debs/politique-confidentialite", locale),
      languages: buildLanguageAlternates("/debs/politique-confidentialite"),
    },
  };
}

export default function DebsPrivacyPolicyPage() {
  return <DebsPrivacyPolicyPageClient />;
}
