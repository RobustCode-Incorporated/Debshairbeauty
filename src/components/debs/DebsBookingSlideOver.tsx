"use client";

import { FormEvent, useState } from "react";
import SlideOver from "@/components/SlideOver";
import { DEBS_SERVICE_CATEGORIES } from "@/lib/debs-services";
import type { DebsCatalogItem } from "@/lib/debs-catalog";

const INTL_PHONE_RE = /^\+\d{7,15}$/;

export type DebsBookingTarget =
  | { kind: "category"; categoryId: string }
  | { kind: "service"; item: DebsCatalogItem };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  target: DebsBookingTarget;
  onTargetCategoryChange?: (categoryId: string) => void;
};

/**
 * Shared with `/debs` (category cards) and `/debs/prestations` (full
 * catalogue — one exact-priced service per row). Both post to the same
 * `POST /api/debs/checkout`, which prices server-side either from the
 * category's starting deposit or the catalogue item's exact price.
 */
export default function DebsBookingSlideOver({ isOpen, onClose, target, onTargetCategoryChange }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceEuros = target.kind === "service"
    ? target.item.priceEuros
    : DEBS_SERVICE_CATEGORIES.find((category) => category.id === target.categoryId)?.minPriceEuros ?? 0;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!INTL_PHONE_RE.test(form.phone.trim())) {
      setError("Le numéro doit commencer par le code pays, ex : +32471234567");
      return;
    }

    const requestedDate = new Date(`${form.date}T${form.time || "00:00"}:00`);
    if (Number.isNaN(requestedDate.getTime())) {
      setError("Date ou heure invalide.");
      return;
    }
    if (requestedDate.getTime() < Date.now()) {
      setError("Merci de choisir un créneau futur.");
      return;
    }
    const dayOfWeek = new Date(`${form.date}T00:00:00`).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      setError("Le salon est fermé le dimanche et le lundi. Merci de choisir un jour entre mardi et samedi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/debs/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: target.kind === "category" ? target.categoryId : "Cheveux",
          serviceId: target.kind === "service" ? target.item.id : undefined,
        }),
      });
      const data: { url?: string; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de créer la session de paiement.");

      if (data.url) {
        setSuccess("Redirection vers le paiement sécurisé…");
        window.location.assign(data.url);
      } else {
        throw new Error("Réponse invalide du serveur de paiement.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setIsSubmitting(false);
    }
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Réserver un rendez-vous" theme="light">
      <form onSubmit={submit} className="space-y-5">
        {target.kind === "service" ? (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-amber-700 font-semibold mb-1">{target.item.categoryLabel}</p>
            <p className="text-stone-900 font-bold">{target.item.name}</p>
            <p className="text-sm text-stone-600 mt-1">
              {target.item.startingFrom ? "À partir de " : ""}<strong className="text-stone-900">{target.item.priceEuros}€</strong> — réglé en ligne à la réservation.
            </p>
          </div>
        ) : (
          <p className="text-sm text-stone-500">
            Choisis une prestation, une date et une heure. Un acompte de <strong className="text-stone-700">{priceEuros}€</strong> (prix de départ de la prestation) est réglé par carte pour confirmer ; le solde éventuel se règle sur place après la prestation.
          </p>
        )}

        {[['firstName', 'Prénom'], ['lastName', 'Nom']].map(([field, label]) => (
          <label key={field} className="block text-sm text-stone-700">
            {label}
            <input
              required
              type="text"
              value={form[field as 'firstName' | 'lastName']}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
            />
          </label>
        ))}

        <label className="block text-sm text-stone-700">
          Téléphone
          <input
            required
            type="tel"
            placeholder="+32471234567"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
          />
          <span className="text-xs text-stone-400 mt-1 block">Commencez par le code pays, ex&nbsp;: +32471234567</span>
        </label>

        {target.kind === "category" && (
          <label className="block text-sm text-stone-700">
            Prestation
            <select
              value={target.categoryId}
              onChange={(event) => onTargetCategoryChange?.(event.target.value)}
              className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
            >
              {DEBS_SERVICE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-stone-700">
            Date
            <input
              required
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
            />
          </label>
          <label className="block text-sm text-stone-700">
            Heure
            <input
              required
              type="time"
              value={form.time}
              onChange={(event) => setForm({ ...form, time: event.target.value })}
              className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
            />
          </label>
        </div>
        <p className="text-xs text-stone-400 -mt-3">Ouvert du mardi au samedi, 10:00–20:30 selon le jour.</p>

        <label className="block text-sm text-stone-700">
          Notes (facultatif)
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
            placeholder="Style souhaité, référence, contraintes horaires..."
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <button disabled={isSubmitting} type="submit" className="w-full bg-stone-900 px-4 py-4 font-bold uppercase tracking-wider text-white hover:bg-amber-700 transition-colors disabled:opacity-60">
          {isSubmitting ? 'Redirection…' : `Payer ${priceEuros}€ et réserver`}
        </button>
      </form>
    </SlideOver>
  );
}
