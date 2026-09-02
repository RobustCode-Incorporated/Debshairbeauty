import { routing } from "@/i18n/routing";

export function resolveLocale(locale: unknown): string {
  return typeof locale === "string" && (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}

/** Prefixes `pathname` with the locale segment, matching the `as-needed` routing config (no prefix for the default locale). */
export function localizedPath(pathname: string, locale: string): string {
  return locale === routing.defaultLocale ? pathname : `/${locale}${pathname}`;
}
