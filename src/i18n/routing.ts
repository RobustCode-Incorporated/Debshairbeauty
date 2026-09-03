import { defineRouting } from "next-intl/routing";

// Central i18n routing configuration: French stays unprefixed at the
// existing URLs (/debs, /debs/prestations, ...) since it's the site's
// original/default language, while the other three get a locale prefix
// (/en/debs, /nl/debs, /es/debs).
export const routing = defineRouting({
  locales: ["fr", "en", "nl", "es"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  // `httpOnly` isn't offered here on purpose: next-intl's own client-side
  // navigation needs to read/write this cookie (a router-cache staleness
  // workaround), so it can't be blocked from JS. `secure` has no such
  // constraint and the whole site is HTTPS-only, so there's no downside.
  localeCookie: { secure: true },
});

export type AppLocale = (typeof routing.locales)[number];
