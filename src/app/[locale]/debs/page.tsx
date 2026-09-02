"use client";

import { motion } from "framer-motion";
import {
  Calendar, Star, MapPin, Clock, Gem, Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Playfair_Display } from "next/font/google";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import DebsNav from "@/components/debs/DebsNav";
import DebsBookingSlideOver, { DebsBookingTarget } from "@/components/debs/DebsBookingSlideOver";
import DebsProductPurchaseSlideOver from "@/components/debs/DebsProductPurchaseSlideOver";
import { DEBS_PRODUCTS, DEBS_PRODUCT_CATEGORIES, type DebsProduct } from "@/lib/debs-products";

const playfair = Playfair_Display({ subsets: ["latin"] });

const gallery = ["/download (1).webp", "/download (4).webp", "/download (5).webp", "/download (10).webp"];

const HOURS: Array<{ dayKey: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"; value: string | null }> = [
  { dayKey: "monday", value: null },
  { dayKey: "tuesday", value: "10:00 – 18:00" },
  { dayKey: "wednesday", value: "10:00 – 19:00" },
  { dayKey: "thursday", value: "10:00 – 19:00" },
  { dayKey: "friday", value: "10:00 – 19:30" },
  { dayKey: "saturday", value: "10:00 – 20:30" },
  { dayKey: "sunday", value: null },
];

const ADDRESS = "150A Rue de Laeken, 1000 Bruxelles";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Debs Hair Beauty, ${ADDRESS}`)}`;
const PHONE_DISPLAY = "+32 472 34 19 68";
const PHONE_TEL = "+32472341968";

export default function DebsSalonPage() {
  const t = useTranslations("Home");
  const tProductCategories = useTranslations("ProductCategories");
  const tProducts = useTranslations("Products");

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<DebsBookingTarget>({ kind: "category", categoryId: "Cheveux" });
  const [showCancelledNotice, setShowCancelledNotice] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState<DebsProduct | null>(null);

  useEffect(() => {
    // Reads the post-redirect URL after a mount, deliberately: the server has
    // no `window` to render this from, so setting it any earlier would cause
    // a hydration mismatch instead of just a one-frame-later banner.
    if (new URLSearchParams(window.location.search).get("booking") === "annulee") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowCancelledNotice(true);
    }
  }, []);

  const openBookingFor = (category: string) => {
    setBookingTarget({ kind: "category", categoryId: category });
    setIsBookingOpen(true);
  };

  const openPurchaseFor = (product: DebsProduct) => {
    setPurchaseProduct(product);
    setIsPurchaseOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#fbf9f6] text-stone-800 font-sans selection:bg-amber-100 selection:text-stone-900">
      <DebsNav onBookClick={() => openBookingFor("Cheveux")} />

      {showCancelledNotice && (
        <div className="fixed top-4 inset-x-4 z-[60] mx-auto max-w-md flex items-center justify-between gap-3 bg-stone-900 text-white text-sm px-4 py-3 shadow-xl">
          <span>{t("cancelledNotice")}</span>
          <button type="button" onClick={() => setShowCancelledNotice(false)} className="text-stone-400 hover:text-white transition-colors shrink-0">✕</button>
        </div>
      )}

      {/* --- HERO --- */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/Debs sal.webp"
            alt={t("gallery.imageAlt")}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 bg-black/30 backdrop-blur-md mb-8"
          >
            <MapPin className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-medium tracking-widest uppercase text-white">{t("hero.locationBadge")}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className={`${playfair.className} text-6xl md:text-8xl text-white mb-3 drop-shadow-2xl italic`}>
              Debs
            </h1>
            <p className="text-sm md:text-base tracking-[0.5em] uppercase text-amber-200 font-semibold mb-6">
              Hair &amp; Beauty
            </p>
            <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto mb-4">
              {t("hero.tagline")}
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-10">
              {[0, 1, 2, 3].map((i) => (
                <Star key={i} className="w-4 h-4 text-amber-300 fill-amber-300" />
              ))}
              <Star className="w-4 h-4 text-amber-300" />
              <span className="text-sm text-white/80 ml-2">{t("hero.reviews")}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button type="button" onClick={() => openBookingFor("Cheveux")} className="px-8 py-4 bg-white text-stone-900 font-bold uppercase tracking-wider rounded-sm transition-all hover:bg-amber-50 flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              {t("hero.bookCta")}
            </button>
            <Link href="/debs/prestations" className="px-8 py-4 bg-transparent text-white font-bold uppercase tracking-wider border border-white/40 rounded-sm transition-all hover:border-white hover:bg-white/10 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t("hero.seeServicesCta")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- INFO BAR --- */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
          <div className="flex items-center gap-3 px-8 py-6">
            <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">{t("infoBar.addressLabel")}</p>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-stone-700 hover:text-amber-700 transition-colors">{ADDRESS}</a>
            </div>
          </div>
          <div className="flex items-center gap-3 px-8 py-6">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">{t("infoBar.hoursLabel")}</p>
              <p className="text-sm text-stone-700">{t("infoBar.hoursValue")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-8 py-6">
            <Gem className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">{t("infoBar.paymentLabel")}</p>
              <p className="text-sm text-stone-700">{t("infoBar.paymentValue")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- BOUTIQUE --- */}
      <section id="boutique" className="py-24 px-4 bg-[#fbf9f6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3 block">{t("boutique.eyebrow")}</span>
            <h2 className={`${playfair.className} text-4xl md:text-5xl text-stone-900 mb-4`}>
              {t("boutique.title")}
            </h2>
            <p className="text-stone-500 text-lg max-w-2xl mx-auto">
              {t("boutique.subtitle")}
            </p>
          </div>

          {DEBS_PRODUCT_CATEGORIES.map((category) => {
            const items = DEBS_PRODUCTS.filter((product) => product.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category} className="mb-16 last:mb-0">
                <h3 className="text-xs font-bold uppercase tracking-[0.28em] text-stone-400 mb-6">{tProductCategories(category)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 }}
                      className="group relative bg-white border border-stone-200 overflow-hidden flex flex-col hover:border-amber-400 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative h-44 w-full overflow-hidden">
                        <Image
                          src={product.image}
                          alt={tProducts(`${product.id}.name`)}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.placeholder && (
                          <span className="absolute top-3 left-3 bg-stone-900/80 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                            {t("boutique.exampleBadge")}
                          </span>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <p className="text-stone-900 font-bold mb-1">{tProducts(`${product.id}.name`)}</p>
                        {product.variant && <p className="text-sm text-stone-500 mb-2">{tProducts(`${product.id}.variant`)}</p>}
                        <p className="text-2xl font-black text-stone-900 mb-4 mt-auto">{product.priceEuros}€</p>
                        <button
                          type="button"
                          disabled={product.placeholder}
                          onClick={() => openPurchaseFor(product)}
                          title={product.placeholder ? t("boutique.comingSoon") : undefined}
                          className="w-full py-3 bg-stone-900 text-white font-bold uppercase text-sm tracking-wider hover:bg-amber-700 transition-colors disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed disabled:hover:bg-stone-200"
                        >
                          {product.placeholder ? t("boutique.comingSoon") : t("boutique.buy")}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="text-center mt-4">
            <Link href="/debs/prestations" className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 text-stone-800 font-bold uppercase text-sm tracking-wider hover:border-amber-600 hover:text-amber-700 transition-colors">
              {t("boutique.seeCatalogCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* --- GALLERY --- */}
      <section id="galerie" className="py-20 px-4 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3 block">{t("gallery.eyebrow")}</span>
            <h2 className={`${playfair.className} text-4xl md:text-5xl text-stone-900`}>
              {t("gallery.title")}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((src) => (
              <div key={src} className="relative aspect-[3/4] overflow-hidden group">
                <Image
                  src={src}
                  alt={t("gallery.imageAlt")}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TEAM --- */}
      <section id="equipe" className="py-24 px-4 bg-[#fbf9f6] border-t border-stone-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] w-full"
          >
            <Image src="/download (7).webp" alt={t("team.imageAlt")} fill className="object-cover object-center" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3 block">{t("team.eyebrow")}</span>
            <h2 className={`${playfair.className} text-4xl md:text-5xl text-stone-900 mb-4`}>
              {t("team.name")}
            </h2>
            <div className="flex items-center gap-1.5 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
              ))}
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-stone-500 ml-2">{t("team.reviews")}</span>
            </div>
            <p className="text-stone-600 leading-relaxed mb-4">
              {t("team.bio")}
            </p>
            <button type="button" onClick={() => openBookingFor("Cheveux")} className="px-6 py-3 bg-stone-900 text-white font-bold uppercase text-sm tracking-wider hover:bg-amber-700 transition-colors">
              {t("team.bookWithHerCta")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* --- HOURS & LOCATION --- */}
      <section id="horaires" className="py-24 px-4 bg-white border-t border-stone-200">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3 block">{t("hours.eyebrow")}</span>
            <h2 className={`${playfair.className} text-3xl text-stone-900 mb-6`}>{t("hours.title")}</h2>
            <ul className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {HOURS.map((row) => (
                <li key={row.dayKey} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-stone-600">{t(`hours.days.${row.dayKey}`)}</span>
                  <span className={row.value === null ? "text-stone-400" : "font-semibold text-stone-900"}>{row.value ?? t("hours.closed")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3 block">{t("location.eyebrow")}</span>
            <h2 className={`${playfair.className} text-3xl text-stone-900 mb-6`}>{t("location.title")}</h2>
            <p className="text-stone-600 leading-relaxed mb-2">{ADDRESS}</p>
            <p className="text-stone-500 text-sm mb-6">{t("location.metroHint")}</p>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 text-stone-800 font-bold uppercase text-sm tracking-wider hover:border-amber-600 hover:text-amber-700 transition-colors">
              <MapPin className="w-4 h-4" />
              {t("location.directionsCta")}
            </a>
          </div>
        </div>
      </section>

      {/* --- MODAL RESERVATION --- */}
      <DebsBookingSlideOver
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        target={bookingTarget}
        onTargetCategoryChange={(categoryId) => setBookingTarget({ kind: "category", categoryId })}
      />

      {/* --- MODAL ACHAT BOUTIQUE --- */}
      <DebsProductPurchaseSlideOver
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        product={purchaseProduct}
      />

      {/* --- FOOTER --- */}
      <footer className="relative border-t border-stone-200 bg-white text-stone-600">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className={`${playfair.className} text-lg italic text-stone-900`}>{t("footer.brand")}</h3>
            <p className="text-sm leading-relaxed text-stone-600">
              {ADDRESS}<br />
              {t("footer.neighborhood")}
            </p>
            <p className="text-sm text-stone-600">
              📞 <a href={`tel:${PHONE_TEL}`} className="font-medium text-stone-900 transition hover:text-amber-700">{PHONE_DISPLAY}</a>
            </p>
            <p className="text-xs text-stone-400">{t("footer.metroHint")}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.28em] text-stone-400">{t("footer.bookingHeading")}</h3>
            <button type="button" onClick={() => openBookingFor("Cheveux")} className="inline-flex items-center gap-2 text-sm text-stone-700 hover:text-amber-700 transition-colors">
              <Calendar className="w-4 h-4" />
              {t("footer.bookCta")}
            </button>
            <p className="text-xs text-stone-400">{t("footer.bookingHint")}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.28em] text-stone-400">{t("footer.followHeading")}</h3>
            <a href="https://www.instagram.com/debs_hair_beauty/" target="_blank" rel="noopener noreferrer" className="block text-sm text-stone-700 transition hover:text-amber-700">Instagram</a>
            <a href="https://www.tiktok.com/@debshairbeautysalon" target="_blank" rel="noopener noreferrer" className="block text-sm text-stone-700 transition hover:text-amber-700">TikTok</a>
            <p className="text-sm leading-relaxed text-stone-600 pt-2">
              {t("footer.devBy")} <a href="https://www.robust-code.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-stone-900 transition hover:text-amber-700">ROBUST CODE S.A.R.L</a>
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}
