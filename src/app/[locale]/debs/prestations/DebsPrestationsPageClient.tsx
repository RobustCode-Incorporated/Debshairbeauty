"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { Playfair_Display } from "next/font/google";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import DebsNav from "@/components/debs/DebsNav";
import DebsBookingSlideOver, { DebsBookingTarget } from "@/components/debs/DebsBookingSlideOver";
import { DEBS_CATALOG_SECTIONS } from "@/lib/debs-catalog";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function DebsPrestationsPage() {
  const t = useTranslations("Prestations");
  const tCatalogCategories = useTranslations("CatalogCategories");
  const tCatalogItems = useTranslations("CatalogItems");

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<DebsBookingTarget>({
    kind: "category",
    categoryId: "Cheveux",
  });

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-stone-800 font-sans selection:bg-amber-100 selection:text-stone-900">
      <DebsNav onBookClick={() => setIsBookingOpen(true)} />

      <section className="py-16 sm:py-20 px-4 border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3 block">
            {t("eyebrow")}
          </span>
          <h1 className={`${playfair.className} text-4xl md:text-5xl text-stone-900 mb-4`}>
            {t("title")}
          </h1>
          <p className="text-stone-500 text-lg">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-16">
          {DEBS_CATALOG_SECTIONS.map((section) => (
            <div key={section.categoryLabel}>
              <h2 className={`${playfair.className} text-2xl md:text-3xl text-stone-900 mb-6 pb-3 border-b border-stone-200`}>
                {tCatalogCategories(section.categoryLabel)}
              </h2>
              <ul className="divide-y divide-stone-200">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingTarget({ kind: "service", item });
                        setIsBookingOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-4 py-4 text-left group hover:bg-amber-50/60 transition-colors px-2 -mx-2"
                    >
                      <span className="text-stone-700 group-hover:text-stone-900 transition-colors">{tCatalogItems(item.id)}</span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-stone-900">
                          {item.startingFrom ? t("startingFromPrefix") : ""}{item.priceEuros}€
                        </span>
                        <Calendar className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 border-t border-stone-200 bg-white text-center">
        <Link href="/debs" className="text-sm text-stone-500 hover:text-amber-700 transition-colors">
          {t("backToHome")}
        </Link>
      </section>

      <DebsBookingSlideOver
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        target={bookingTarget}
        onTargetCategoryChange={(categoryId) => setBookingTarget({ kind: "category", categoryId })}
      />
    </div>
  );
}
