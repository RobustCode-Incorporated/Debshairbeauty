import { defineRouting } from "next-intl/routing";

// Central i18n routing configuration: French stays unprefixed at the
// existing URLs (/debs, /debs/prestations, ...) since it's the site's
// original/default language, while the other three get a locale prefix
// (/en/debs, /nl/debs, /es/debs).
export const routing = defineRouting({
  locales: ["fr", "en", "nl", "es"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
