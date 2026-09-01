"use client";

import { FormEvent, useState } from "react";
import SlideOver from "@/components/SlideOver";
import type { DebsProduct } from "@/lib/debs-products";

const INTL_PHONE_RE = /^\+\d{7,15}$/;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: DebsProduct | null;
};

export default function DebsProductPurchaseSlideOver({ isOpen, onClose, product }: Props) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", quantity: 1, notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const total = product.priceEuros * form.quantity;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!INTL_PHONE_RE.test(form.phone.trim())) {
      setError("Le numéro doit commencer par le code pays, ex : +32471234567");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/debs/products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productId: product.id }),
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
    <SlideOver isOpen={isOpen} onClose={onClose} title="Acheter un produit" theme="light">
      <form onSubmit={submit} className="space-y-5">
        <div className="border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-semibold mb-1">{product.category}</p>
          <p className="text-stone-900 font-bold">{product.name}</p>
          {product.variant && <p className="text-sm text-stone-600">{product.variant}</p>}
          <p className="text-sm text-stone-600 mt-1">
            <strong className="text-stone-900">{product.priceEuros}€</strong> — payé en ligne, à récupérer au salon.
          </p>
        </div>

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

        <label className="block text-sm text-stone-700">
          Quantité
          <input
            required
            type="number"
            min={1}
            max={10}
            value={form.quantity}
            onChange={(event) => setForm({ ...form, quantity: Math.max(1, Math.min(10, Number(event.target.value) || 1)) })}
            className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
          />
        </label>

        <label className="block text-sm text-stone-700">
          Notes (facultatif)
          <textarea
            rows={2}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-stone-900 outline-none focus:border-amber-600"
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <button disabled={isSubmitting} type="submit" className="w-full bg-stone-900 px-4 py-4 font-bold uppercase tracking-wider text-white hover:bg-amber-700 transition-colors disabled:opacity-60">
          {isSubmitting ? 'Redirection…' : `Payer ${total}€ et acheter`}
        </button>
      </form>
    </SlideOver>
  );
}
