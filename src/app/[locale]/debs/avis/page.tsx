"use client";

import { Star, ExternalLink, XCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Playfair_Display } from "next/font/google";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import DebsNav from "@/components/debs/DebsNav";
import { useRouter } from "@/i18n/navigation";

const playfair = Playfair_Display({ subsets: ["latin"] });

const LOW_RATING_THRESHOLD = 4;

function AvisContent() {
  const t = useTranslations("Avis");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "already" | "invalid" | "error">(
    token ? "idle" : "invalid",
  );
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);

  const submit = async () => {
    setStatus("submitting");
    try {
      const response = await fetch("/api/debs/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment, locale }),
      });
      const data: { ok?: boolean; googleUrl?: string | null; error?: string } = await response.json();

      if (response.status === 409) {
        setStatus("already");
        return;
      }
      if (response.status === 404) {
        setStatus("invalid");
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }

      setGoogleUrl(data.googleUrl ?? null);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center text-center max-w-md">
        <XCircle className="w-12 h-12 text-red-500 mb-6" />
        <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>{t("invalidTitle")}</h1>
        <p className="text-stone-500">{t("invalidBody")}</p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="flex flex-col items-center text-center max-w-md">
        <Star className="w-12 h-12 text-amber-500 mb-6 fill-amber-500" />
        <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>{t("alreadySubmittedTitle")}</h1>
        <p className="text-stone-500">{t("alreadySubmittedBody")}</p>
      </div>
    );
  }

  if (status === "sent") {
    const isHigh = rating >= LOW_RATING_THRESHOLD;
    return (
      <div className="flex flex-col items-center text-center max-w-md">
        <Star className="w-12 h-12 text-amber-500 mb-6 fill-amber-500" />
        <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>
          {isHigh ? t("thanksHighTitle") : t("thanksLowTitle")}
        </h1>
        <p className="text-stone-500 mb-8">{isHigh ? t("thanksHighBody") : t("thanksLowBody")}</p>
        {isHigh && googleUrl && (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-bold uppercase text-sm tracking-wider hover:bg-amber-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {t("googleCta")}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center max-w-md w-full">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3 block">{t("eyebrow")}</span>
      <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>{t("title")}</h1>
      <p className="text-stone-500 mb-8">{t("subtitle")}</p>

      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} / 5`}
            className="p-1"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                value <= rating ? "text-amber-500 fill-amber-500" : "text-stone-300"
              }`}
            />
          </button>
        ))}
      </div>

      {rating > 0 && rating < LOW_RATING_THRESHOLD && (
        <textarea
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("commentPlaceholder")}
          className="w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600 mb-6"
        />
      )}

      {status === "error" && <p role="alert" className="text-sm text-red-600 mb-4">{tCommon("genericError")}</p>}

      <button
        type="button"
        disabled={rating === 0 || status === "submitting"}
        onClick={submit}
        className="w-full py-4 bg-stone-900 text-white font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? t("submitting") : t("submitCta")}
      </button>
    </div>
  );
}

export default function DebsAvisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-stone-800 font-sans">
      <DebsNav onBookClick={() => router.push("/debs")} />
      <div className="flex items-center justify-center px-4 py-20">
        <Suspense fallback={null}>
          <AvisContent />
        </Suspense>
      </div>
    </div>
  );
}
