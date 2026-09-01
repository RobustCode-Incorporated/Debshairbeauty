"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/debs", label: "Accueil" },
  { href: "/debs/prestations", label: "Prestations" },
  { href: "/debs#boutique", label: "Boutique" },
  { href: "/debs#galerie", label: "Galerie" },
  { href: "/debs#equipe", label: "Équipe" },
  { href: "/debs#horaires", label: "Horaires" },
];

type Props = {
  onBookClick: () => void;
};

export default function DebsNav({ onBookClick }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        <div className="hidden md:block">
          <button
            type="button"
            onClick={onBookClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Réserver
          </button>
        </div>

        <button
          type="button"
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
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
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onBookClick();
                }}
                className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 text-white text-sm font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Réserver
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
