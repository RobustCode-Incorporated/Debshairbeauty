import { routing } from "@/i18n/routing";

// Fixed production domain (see ROADMAP.md / DNS setup) — used as
// `metadataBase` and to build absolute canonical/sitemap URLs. Not read from
// an env var: this is the salon's one permanent public domain, not something
// that varies per deployment/environment.
export const DEBS_SITE_URL = "https://www.debshairbeauty.com";

export function resolveLocale(locale: unknown): string {
  return typeof locale === "string" && (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}

/** Prefixes `pathname` with the locale segment, matching the `as-needed` routing config (no prefix for the default locale). */
export function localizedPath(pathname: string, locale: string): string {
  return locale === routing.defaultLocale ? pathname : `/${locale}${pathname}`;
}

/** Absolute, canonical-ready URL for `pathname` in `locale` (e.g. for `alternates.canonical`, sitemap entries). */
export function absoluteUrl(pathname: string, locale: string): string {
  return `${DEBS_SITE_URL}${localizedPath(pathname, locale)}`;
}

/** `alternates.languages` map for every supported locale, plus `x-default` pointing at the default-locale URL — for `generateMetadata`. */
export function buildLanguageAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(pathname, locale);
  }
  languages["x-default"] = absoluteUrl(pathname, routing.defaultLocale);
  return languages;
}
