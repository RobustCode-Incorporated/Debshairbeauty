"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Calendar, Globe } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  fr: "FR",
  en: "EN",
  nl: "NL",
  es: "ES",
};

type Props = {
  onBookClick: () => void;
};

/** Switches locale while staying on the current page (and query string). */
function useLocaleSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  return (locale: string) => {
    const query = searchParams.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { locale });
  };
}

function LanguageSwitcher({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeLocale = useLocale();
  const switchLocale = useLocaleSwitch();
  const t = useTranslations("Nav");

  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-1 mt-3 px-2 py-2 border-b border-stone-100">
        {routing.locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => switchLocale(locale)}
            className={`px-3 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
              locale === activeLocale ? "text-amber-700" : "text-stone-500 hover:text-amber-700"
            }`}
          >
            {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${t("language")}: ${LOCALE_LABELS[activeLocale] ?? activeLocale.toUpperCase()}`}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-stone-600 hover:text-amber-700 transition-colors"
      >
        <Globe className="w-4 h-4" />
        {LOCALE_LABELS[activeLocale] ?? activeLocale.toUpperCase()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[7rem] bg-white border border-stone-200 shadow-lg py-1"
            >
              {routing.locales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    switchLocale(locale);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    locale === activeLocale ? "text-amber-700 bg-amber-50" : "text-stone-600 hover:bg-stone-50 hover:text-amber-700"
                  }`}
                >
                  {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DebsNav({ onBookClick }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations("Nav");

  const LINKS = [
    { href: "/debs", label: t("home") },
    { href: "/debs/prestations", label: t("prestations") },
    { href: "/debs#boutique", label: t("boutique") },
    { href: "/debs#galerie", label: t("gallery") },
    { href: "/debs#equipe", label: t("team") },
    { href: "/debs#horaires", label: t("hours") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        <Link href="/debs" className="flex items-center gap-3 shrink-0" onClick={() => setIsMenuOpen(false)}>
          <Image
            src="/logo debs hair&beauty.jpg"
            alt="Debs Hair Beauty"
            width={44}
            height={44}
            className="rounded-full object-cover"
            priority
          />
          <span className="hidden sm:block text-sm font-bold uppercase tracking-widest text-stone-900">
            Debs <span className="text-amber-700 font-normal">Hair &amp; Beauty</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold uppercase tracking-wide text-stone-600 hover:text-amber-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onBookClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            {t("book")}
          </button>
        </div>

        <button
          type="button"
          aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="md:hidden p-2 text-stone-700 hover:text-amber-700 transition-colors"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-stone-200 bg-white"
          >
            <div className="flex flex-col px-4 py-4 gap-1">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-2 py-3 text-sm font-semibold uppercase tracking-wide text-stone-700 hover:text-amber-700 transition-colors border-b border-stone-100 last:border-b-0"
                >
                  {link.label}
                </Link>
              ))}
              <LanguageSwitcher variant="mobile" />
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onBookClick();
                }}
                className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 text-white text-sm font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {t("book")}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
