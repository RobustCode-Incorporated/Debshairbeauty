"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "debsAdminToken";
const FULL_REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;

// Mirrors DEBS_SERVICE_CATEGORIES (src/lib/debs-services.ts) — a fixed,
// hand-maintained list of 6 categories, id and display label identical.
const CATEGORY_OPTIONS = ["Cheveux", "Ongles", "Épilation", "Visage", "Massage", "Maquillage"];

type Appointment = {
  id: string;
  dateTime: string;
  category: string;
  notes: string | null;
  amountCents: number | null;
  currency: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  paymentStatus: string;
  stripePaymentIntentId: string | null;
};

type RefundOutcome =
  | { outcome: "not_applicable" }
  | { outcome: "refunded"; stripeRefundId: string }
  | { outcome: "failed"; stripePaymentIntentId: string | null };

type CancelResult = { id: string; clientName: string; message: string; stripeReference: string | null };

type ClientMatch = { id: string; firstName: string; lastName: string; phone: string };

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-BE", {
    timeZone: "Europe/Brussels",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function refundMessage(refund: RefundOutcome): { message: string; stripeReference: string | null } {
  if (refund.outcome === "refunded") return { message: "Annulé. Remboursement effectué.", stripeReference: null };
  if (refund.outcome === "failed") {
    return {
      message: "Annulé, mais le remboursement a échoué — à faire manuellement dans Stripe.",
      stripeReference: refund.stripePaymentIntentId,
    };
  }
  return { message: "Annulé. Aucun remboursement (< 24h).", stripeReference: null };
}

export default function DebsAdminPageClient() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [results, setResults] = useState<CancelResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addCategoryId, setAddCategoryId] = useState(CATEGORY_OPTIONS[0]);
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clientMatches, setClientMatches] = useState<ClientMatch[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 0 until the mount effect below sets the real clock reading — used only
  // for the refund-eligibility badge, which is informational (the cancel
  // endpoint always recomputes eligibility server-side), so a one-frame-late
  // conservative default here is harmless.
  const [now, setNow] = useState(0);

  useEffect(() => {
    // The server has no `window`/clock to render this from — reading it any
    // earlier would cause a hydration mismatch instead of a one-frame-later
    // badge update. Same reasoning as the sessionStorage read below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  useEffect(() => {
    // Reads the saved admin token after mount, deliberately: the server has
    // no `sessionStorage` to render this from, so setting it any earlier
    // would cause a hydration mismatch instead of just a one-frame-later
    // auto-login.
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(stored);
      }
    } catch {
      // sessionStorage unavailable (private mode) — she just re-enters the token.
    }
  }, []);

  const fetchAppointments = async (authToken: string) => {
    try {
      const response = await fetch("/api/debs/admin/appointments", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.status === 401) {
        setToken(null);
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        setAuthError("Mot de passe invalide.");
        return;
      }
      if (!response.ok) {
        setLoadError("Impossible de charger les rendez-vous.");
        return;
      }
      const data: { appointments: Appointment[] } = await response.json();
      setLoadError(null);
      setAppointments(data.appointments);
    } catch {
      setLoadError("Impossible de charger les rendez-vous.");
    }
  };

  useEffect(() => {
    // Mirrors DebsBookingSlideOver's fetch().then() shape (a plain Promise
    // chain built inline, not a call into a named async function) so every
    // setState here runs inside a .then()/.catch() callback rather than
    // synchronously in the effect body.
    if (!token) return;
    let cancelled = false;
    fetch("/api/debs/admin/appointments", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 401) {
          setToken(null);
          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch {
            // ignore
          }
          setAuthError("Mot de passe invalide.");
          return;
        }
        if (!response.ok) {
          setLoadError("Impossible de charger les rendez-vous.");
          return;
        }
        const data: { appointments: Appointment[] } = await response.json();
        if (cancelled) return;
        setLoadError(null);
        setAppointments(data.appointments);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Impossible de charger les rendez-vous.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submitToken = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    setAuthError(null);
    try {
      sessionStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // ignore
    }
    setToken(trimmed);
  };

  const cancelAppointment = async (appointment: Appointment) => {
    if (!token) return;
    setCancellingId(appointment.id);
    const clientName = `${appointment.clientFirstName} ${appointment.clientLastName}`;
    try {
      const response = await fetch("/api/debs/admin/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      if (response.status === 409) {
        setResults((prev) => [{ id: appointment.id, clientName, message: "Déjà annulé.", stripeReference: null }, ...prev]);
        fetchAppointments(token);
        return;
      }

      const data: { refund?: RefundOutcome } = await response.json();
      if (!response.ok || !data.refund) {
        setLoadError("L'annulation a échoué. Réessayez.");
        return;
      }

      const { message, stripeReference } = refundMessage(data.refund);
      setAppointments((prev) => prev?.filter((item) => item.id !== appointment.id) ?? prev);
      setResults((prev) => [{ id: appointment.id, clientName, message, stripeReference }, ...prev]);
      setConfirmingId(null);
    } catch {
      setLoadError("L'annulation a échoué. Réessayez.");
    } finally {
      setCancellingId(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const onClientQueryChange = (value: string) => {
    setClientQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const trimmed = value.trim();
    if (!token || trimmed.length < 2) {
      setClientMatches([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetch(`/api/debs/admin/clients?q=${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => (response.ok ? response.json() : { clients: [] }))
        .then((data: { clients: ClientMatch[] }) => setClientMatches(data.clients))
        .catch(() => setClientMatches([]));
    }, 300);
  };

  const selectClientMatch = (match: ClientMatch) => {
    setAddFirstName(match.firstName);
    setAddLastName(match.lastName);
    setAddPhone(match.phone);
    setClientQuery(`${match.firstName} ${match.lastName}`);
    setClientMatches([]);
  };

  const resetAddForm = () => {
    setAddFirstName("");
    setAddLastName("");
    setAddPhone("");
    setAddCategoryId(CATEGORY_OPTIONS[0]);
    setAddDate("");
    setAddTime("");
    setAddNotes("");
    setClientQuery("");
    setClientMatches([]);
    setAddError(null);
  };

  const submitAddAppointment = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setAddSubmitting(true);
    setAddError(null);
    try {
      const response = await fetch("/api/debs/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: addFirstName,
          lastName: addLastName,
          phone: addPhone,
          categoryId: addCategoryId,
          date: addDate,
          time: addTime,
          notes: addNotes,
        }),
      });
      const data: { ok?: boolean; appointmentId?: string; error?: string } = await response.json();
      if (!response.ok || !data.appointmentId) {
        setAddError(data.error ?? "Impossible de créer le rendez-vous.");
        return;
      }
      await fetchAppointments(token);
      resetAddForm();
      setShowAddForm(false);
    } catch {
      setAddError("Impossible de créer le rendez-vous.");
    } finally {
      setAddSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center px-4">
        <form onSubmit={submitToken} className="w-full max-w-sm bg-white border border-stone-200 p-8">
          <h1 className="text-xl font-bold text-stone-900 mb-1">Admin — Debs Hair Beauty</h1>
          <p className="text-sm text-stone-500 mb-6">Gestion des rendez-vous</p>
          <label className="block text-sm font-medium text-stone-700 mb-2" htmlFor="admin-token">
            Mot de passe
          </label>
          <input
            id="admin-token"
            type="password"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            className="w-full border border-stone-300 px-3 py-3 outline-none focus:border-amber-600 mb-4"
            autoFocus
          />
          {authError && (
            <p role="alert" className="text-sm text-red-600 mb-4">
              {authError}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-stone-900 text-white font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors"
          >
            Entrer
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Rendez-vous à venir</h1>
        <p className="text-sm text-stone-500 mb-6">
          Annulation avec remboursement automatique si ≥ 24h avant le rendez-vous.
        </p>

        <button
          type="button"
          onClick={() => {
            setShowAddForm((value) => !value);
            if (showAddForm) resetAddForm();
          }}
          className="mb-6 text-sm font-bold uppercase tracking-wider text-stone-900 hover:text-amber-700"
        >
          {showAddForm ? "Annuler l'ajout" : "+ Ajouter un rendez-vous"}
        </button>

        {showAddForm && (
          <form onSubmit={submitAddAppointment} className="mb-8 border border-stone-200 bg-white p-4 space-y-3">
            <div className="relative">
              <label className="block text-sm font-medium text-stone-700 mb-1">Rechercher une cliente existante</label>
              <input
                type="text"
                value={clientQuery}
                onChange={(event) => onClientQueryChange(event.target.value)}
                placeholder="Nom, prénom ou téléphone"
                className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
              />
              {clientMatches.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-stone-200 mt-1 max-h-48 overflow-y-auto shadow-sm">
                  {clientMatches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => selectClientMatch(match)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-stone-50"
                    >
                      {match.firstName} {match.lastName} — {match.phone}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Prénom</label>
                <input
                  required
                  value={addFirstName}
                  onChange={(event) => setAddFirstName(event.target.value)}
                  className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nom</label>
                <input
                  required
                  value={addLastName}
                  onChange={(event) => setAddLastName(event.target.value)}
                  className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Téléphone</label>
              <input
                required
                value={addPhone}
                onChange={(event) => setAddPhone(event.target.value)}
                placeholder="+32471234567"
                className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
              />
              <p className="text-xs text-stone-400 mt-1">Commencez par l&apos;indicatif pays, ex : +32471234567</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Catégorie</label>
                <select
                  value={addCategoryId}
                  onChange={(event) => setAddCategoryId(event.target.value)}
                  className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
                <input
                  required
                  type="date"
                  value={addDate}
                  onChange={(event) => setAddDate(event.target.value)}
                  className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Heure</label>
                <input
                  required
                  type="time"
                  value={addTime}
                  onChange={(event) => setAddTime(event.target.value)}
                  className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Notes (optionnel)</label>
              <textarea
                rows={2}
                value={addNotes}
                onChange={(event) => setAddNotes(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
              />
            </div>

            {addError && (
              <p role="alert" className="text-sm text-red-600">
                {addError}
              </p>
            )}

            <button
              type="submit"
              disabled={addSubmitting}
              className="text-sm font-bold uppercase tracking-wider px-4 py-2 bg-stone-900 text-white hover:bg-amber-700 disabled:opacity-40"
            >
              {addSubmitting ? "Création…" : "Créer le rendez-vous"}
            </button>
          </form>
        )}

        {results.length > 0 && (
          <div className="mb-8 space-y-2">
            {results.map((result) => (
              <div
                key={result.id}
                className="text-sm border border-stone-200 bg-white px-4 py-3 flex items-center justify-between gap-4"
              >
                <span>
                  <strong>{result.clientName}</strong> — {result.message}
                </span>
                {result.stripeReference && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.stripeReference!, result.id)}
                    className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 shrink-0"
                  >
                    {copiedId === result.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {result.stripeReference}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {loadError && (
          <p role="alert" className="text-sm text-red-600 mb-4">
            {loadError}
          </p>
        )}

        {appointments === null && !loadError && (
          <div className="flex items-center gap-2 text-stone-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        )}

        {appointments !== null && appointments.length === 0 && <p className="text-stone-500">Aucun rendez-vous à venir.</p>}

        <div className="space-y-3">
          {appointments?.map((appointment) => {
            const refundEligible = now > 0 && new Date(appointment.dateTime).getTime() - now >= FULL_REFUND_WINDOW_MS;
            const isConfirming = confirmingId === appointment.id;
            const isCancelling = cancellingId === appointment.id;

            return (
              <div key={appointment.id} className="border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-stone-900">
                      {formatDateTime(appointment.dateTime)} — {appointment.category}
                    </p>
                    <p className="text-sm text-stone-600">
                      {appointment.clientFirstName} {appointment.clientLastName} —{" "}
                      <a
                        href={`tel:${appointment.clientPhone}`}
                        className="font-medium text-stone-900 transition hover:text-amber-700"
                      >
                        {appointment.clientPhone}
                      </a>
                    </p>
                    {appointment.notes && <p className="text-sm text-stone-500 mt-1">{appointment.notes}</p>}
                    <p className="text-sm text-stone-600 mt-1">{formatAmount(appointment.amountCents, appointment.currency)}</p>
                    <span
                      className={`inline-block mt-2 text-xs font-medium px-2 py-1 ${
                        refundEligible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {refundEligible ? "Remboursement intégral si annulé maintenant" : "Acompte non remboursable (< 24h)"}
                    </span>
                  </div>

                  {!isConfirming && (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(appointment.id)}
                      className="text-sm font-bold uppercase tracking-wider text-red-600 hover:text-red-800 shrink-0"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                {isConfirming && (
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-sm text-stone-700">
                      Confirmer l&apos;annulation de {appointment.clientFirstName} {appointment.clientLastName} le{" "}
                      {formatDateTime(appointment.dateTime)} ?{" "}
                      {refundEligible
                        ? `Remboursera ${formatAmount(appointment.amountCents, appointment.currency)}.`
                        : "Aucun remboursement (< 24h)."}
                    </p>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        disabled={isCancelling}
                        className="text-sm text-stone-500 hover:text-stone-900"
                      >
                        Retour
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelAppointment(appointment)}
                        disabled={isCancelling}
                        className="text-sm font-bold uppercase tracking-wider px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                      >
                        {isCancelling ? "Annulation…" : "Confirmer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
