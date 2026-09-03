"use client";

import { useTranslations } from "next-intl";
import { Playfair_Display } from "next/font/google";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import DebsNav from "@/components/debs/DebsNav";
import DebsBookingSlideOver, { DebsBookingTarget } from "@/components/debs/DebsBookingSlideOver";

const playfair = Playfair_Display({ subsets: ["latin"] });

const SECTION_KEYS = [
  "controller",
  "dataCollected",
  "purposes",
  "recipients",
  "retention",
  "cookies",
  "rights",
  "authority",
  "changes",
] as const;

export default function DebsPrivacyPolicyPage() {
  const t = useTranslations("PrivacyPolicy");

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<DebsBookingTarget>({
    kind: "category",
    categoryId: "Cheveux",
  });

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-stone-800 font-sans selection:bg-amber-100 selection:text-stone-900">
      <DebsNav onBookClick={() => setIsBookingOpen(true)} />

      <section className="py-16 sm:py-20 px-4 border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto">
          <Link href="/debs" className="text-sm text-stone-500 hover:text-amber-700 transition-colors">
            {t("backToHome")}
          </Link>
          <h1 className={`${playfair.className} text-4xl md:text-5xl text-stone-900 mt-4 mb-3`}>
            {t("title")}
          </h1>
          <p className="text-stone-400 text-sm mb-6">{t("lastUpdated")}</p>
          <p className="text-stone-600 leading-relaxed">{t("intro")}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {SECTION_KEYS.map((key) => (
            <div key={key}>
              <h2 className={`${playfair.className} text-2xl text-stone-900 mb-3`}>
                {t(`sections.${key}.heading`)}
              </h2>
              {t(`sections.${key}.body`)
                .split("\n\n")
                .map((paragraph, i) => (
                  <p key={i} className="text-stone-600 leading-relaxed whitespace-pre-line mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
            </div>
          ))}
        </div>
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
