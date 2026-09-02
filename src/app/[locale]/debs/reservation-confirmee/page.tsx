"use client";

import { CheckCircle2, XCircle, Loader2, MessageCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Playfair_Display } from "next/font/google";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import DebsNav from "@/components/debs/DebsNav";

const playfair = Playfair_Display({ subsets: ["latin"] });

type ConfirmResult = {
  appointmentId: string;
  whatsappUrl: string | null;
  firstName: string;
  category: string;
  date: string;
  time: string;
};

function ConfirmationContent() {
  const t = useTranslations("ReservationConfirmee");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">(() => (sessionId ? "loading" : "error"));
  const [error, setError] = useState<string | null>(() => (sessionId ? null : t("noSession")));
  const [result, setResult] = useState<ConfirmResult | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/debs/checkout/confirm?session_id=${encodeURIComponent(sessionId)}&locale=${encodeURIComponent(locale)}`);
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setStatus("error");
          setError(data.error ?? t("confirmFailed"));
          return;
        }

        setResult(data);
        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError(tCommon("genericError"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, locale, t, tCommon]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-6" />
        <p className="text-stone-500">{tCommon("loadingPayment")}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center text-center max-w-md">
        <XCircle className="w-12 h-12 text-red-500 mb-6" />
        <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>{tCommon("notConfirmedTitle")}</h1>
        <p className="text-stone-500 mb-8">{error}</p>
        <Link href="/debs" className="px-6 py-3 bg-stone-900 text-white font-bold uppercase text-sm tracking-wider hover:bg-amber-700 transition-colors">
          {tCommon("backToSite")}
        </Link>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex flex-col items-center text-center max-w-md">
      <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-6" />
      <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>{t("successTitle")}</h1>
      <p className="text-stone-500 mb-1">
        {t.rich("successMessage", {
          firstName: result.firstName,
          category: result.category,
          date: result.date,
          time: result.time,
          strong: (chunks) => <strong className="text-stone-700">{chunks}</strong>,
        })}
      </p>
      <p className="text-stone-400 text-sm mb-8">{t("balanceNote")}</p>
      {result?.whatsappUrl && (
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-bold uppercase text-sm tracking-wider hover:bg-amber-700 transition-colors mb-4"
        >
          <MessageCircle className="w-4 h-4" />
          {tCommon("whatsappCta")}
        </a>
      )}
      <Link href="/debs" className="text-sm text-stone-500 hover:text-amber-700 transition-colors">
        {tCommon("backToSite")}
      </Link>
    </div>
  );
}

export default function DebsReservationConfirmeePage() {
  const tCommon = useTranslations("Common");
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#fbf9f6] text-stone-800 font-sans">
      <DebsNav onBookClick={() => router.push("/debs")} />
      <div className="flex items-center justify-center px-4 py-20">
      <Suspense
        fallback={
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-6" />
            <p className="text-stone-500">{tCommon("loading")}</p>
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
      </div>
    </main>
  );
}
