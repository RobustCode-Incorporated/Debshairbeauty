import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Debs Hair & Beauty — Bientôt disponible",
  description: "Le nouveau site de Debs Hair & Beauty (Bruxelles) arrive très bientôt.",
};

const ADDRESS = "150A Rue de Laeken, 1000 Bruxelles";
const PHONE_DISPLAY = "+32 472 34 19 68";
const PHONE_TEL = "+32472341968";

// Root page: shows the "coming soon" announcement while the full site
// (booking, catalogue, boutique) stays reachable at /debs for preview and
// testing. To launch fully, replace this file's content with a redirect to
// /debs (or move /debs's content here) — see README.md.
export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-[#fbf9f6] text-stone-800 font-sans flex flex-col items-center justify-center px-4 py-16 text-center">
      <Image
        src="/logo debs hair&beauty.jpg"
        alt="Debs Hair Beauty"
        width={96}
        height={96}
        className="rounded-full object-cover mb-8"
        priority
      />

      <span className="text-xs font-bold uppercase tracking-[0.35em] text-amber-600 mb-4">
        Ouverture prochaine
      </span>

      <h1 className={`${playfair.className} text-5xl md:text-6xl text-stone-900 italic mb-4`}>
        Debs <span className="not-italic text-3xl md:text-4xl align-middle">Hair &amp; Beauty</span>
      </h1>

      <p className="text-stone-500 text-lg max-w-xl mb-10">
        Notre nouveau site — réservation en ligne et boutique — arrive très bientôt.
        En attendant, contactez-nous directement pour prendre rendez-vous.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 text-sm text-stone-600">
        <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-2 hover:text-amber-700 transition-colors">
          <Phone className="w-4 h-4 text-amber-600" />
          {PHONE_DISPLAY}
        </a>
        <span className="inline-flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" />
          {ADDRESS}
        </span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <a
          href="https://www.instagram.com/debs_hair_beauty/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-600 hover:text-amber-700 transition-colors"
        >
          Instagram
        </a>
        <a
          href="https://www.tiktok.com/@debshairbeautysalon"
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-600 hover:text-amber-700 transition-colors"
        >
          TikTok
        </a>
      </div>
    </main>
  );
}
