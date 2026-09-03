import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { DEBS_SITE_URL } from "@/lib/locale-url";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(DEBS_SITE_URL),
    title: { default: t("title"), template: `%s — ${t("title")}` },
    description: t("description"),
    // No layout-level `alternates` here on purpose: canonical/hreflang must
    // match the *current* pathname, so each page sets its own (see
    // SEO-STRATEGY-DEBS.md, step 2) rather than inheriting a generic "/"
    // that would conflict with next-intl's own per-path hreflang Link
    // headers (already correct, sent automatically by the proxy).
    openGraph: {
      siteName: t("title"),
      locale,
      type: "website",
      images: ["/download (1).webp"],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 transition-colors duration-300">
        <NextIntlClientProvider locale={locale}>
          <main className="flex-grow">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
