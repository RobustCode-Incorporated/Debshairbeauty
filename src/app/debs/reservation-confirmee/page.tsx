"use client";

import { CheckCircle2, XCircle, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">(() => (sessionId ? "loading" : "error"));
  const [error, setError] = useState<string | null>(() => (sessionId ? null : "Aucune session de paiement trouvée."));
  const [result, setResult] = useState<ConfirmResult | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/debs/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setStatus("error");
          setError(data.error ?? "Impossible de confirmer la réservation.");
          return;
        }

        setResult(data);
        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Une erreur est survenue.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-6" />
        <p className="text-stone-500">Confirmation du paiement en cours…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center text-center max-w-md">
        <XCircle className="w-12 h-12 text-red-500 mb-6" />
        <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>Paiement non confirmé</h1>
        <p className="text-stone-500 mb-8">{error}</p>
        <Link href="/debs" className="px-6 py-3 bg-stone-900 text-white font-bold uppercase text-sm tracking-wider hover:bg-amber-700 transition-colors">
          Retour au site
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center max-w-md">
      <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-6" />
      <h1 className={`${playfair.className} text-3xl text-stone-900 mb-3`}>Réservation confirmée</h1>
      <p className="text-stone-500 mb-1">
        Merci {result?.firstName} ! Votre acompte pour <strong className="text-stone-700">{result?.category}</strong> le{" "}
        <strong className="text-stone-700">{result?.date}</strong> à <strong className="text-stone-700">{result?.time}</strong> a bien été réglé.
      </p>
      <p className="text-stone-400 text-sm mb-8">Le solde éventuel se règle sur place, après la prestation.</p>
      {result?.whatsappUrl && (
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-bold uppercase text-sm tracking-wider hover:bg-amber-700 transition-colors mb-4"
        >
          <MessageCircle className="w-4 h-4" />
          Continuer sur WhatsApp
        </a>
      )}
      <Link href="/debs" className="text-sm text-stone-500 hover:text-amber-700 transition-colors">
        Retour au site
      </Link>
    </div>
  );
}

export default function DebsReservationConfirmeePage() {
  return (
    <main className="min-h-screen bg-[#fbf9f6] text-stone-800 font-sans">
      <DebsNav onBookClick={() => { window.location.href = "/debs"; }} />
      <div className="flex items-center justify-center px-4 py-20">
      <Suspense
        fallback={
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-6" />
            <p className="text-stone-500">Chargement…</p>
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
      </div>
    </main>
  );
}
