import { NextRequest, NextResponse } from 'next/server';
import { getDebsStripe } from '@/lib/debs-stripe';
import { getDebsCategory } from '@/lib/debs-services';
import { getDebsCatalogItem } from '@/lib/debs-catalog';

type CheckoutBody = {
  firstName: unknown;
  lastName: unknown;
  phone: unknown;
  category: unknown;
  serviceId?: unknown;
  date: unknown;
  time: unknown;
  notes?: unknown;
};

const INTL_PHONE_RE = /^\+\d{7,15}$/;

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody;

    const firstName = asNonEmptyString(body.firstName);
    const lastName = asNonEmptyString(body.lastName);
    const phone = asNonEmptyString(body.phone);
    const date = asNonEmptyString(body.date);
    const time = asNonEmptyString(body.time);
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    const categoryId = asNonEmptyString(body.category);
    const serviceId = asNonEmptyString(body.serviceId);
    const catalogItem = serviceId ? getDebsCatalogItem(serviceId) : null;
    const category = !catalogItem && categoryId ? getDebsCategory(categoryId) : null;

    if (serviceId && !catalogItem) {
      return NextResponse.json({ error: 'Prestation inconnue.' }, { status: 400 });
    }
    if (!firstName || !lastName || !phone || !date || !time || (!catalogItem && !category)) {
      return NextResponse.json(
        { error: 'Prénom, nom, téléphone, prestation, date et heure sont obligatoires.' },
        { status: 400 },
      );
    }
    if (!INTL_PHONE_RE.test(phone)) {
      return NextResponse.json(
        { error: 'Le numéro doit commencer par le code pays, ex : +32471234567' },
        { status: 400 },
      );
    }

    const dateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: 'Date ou heure invalide.' }, { status: 400 });
    }
    if (dateTime.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Merci de choisir un créneau futur.' }, { status: 400 });
    }
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      return NextResponse.json(
        { error: 'Le salon est fermé le dimanche et le lundi. Merci de choisir un jour entre mardi et samedi.' },
        { status: 400 },
      );
    }

    const stripe = getDebsStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Le paiement par carte n'est pas encore configuré. Ajoute DEBS_STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }

    const amountEuros = catalogItem ? catalogItem.priceEuros : category!.minPriceEuros;
    const amountCents = Math.round(amountEuros * 100);
    const productName = catalogItem
      ? `Debs Hair Beauty — ${catalogItem.name}`
      : `Debs Hair Beauty — Acompte ${category!.name}`;
    const productDescription = catalogItem
      ? `Prix de la prestation "${catalogItem.name}" (${catalogItem.categoryLabel}), réglé en ligne à la réservation.`
      : `Acompte de réservation, à valoir sur la prestation. Solde éventuel réglé sur place.`;
    const categoryMetadata = catalogItem ? `${catalogItem.categoryLabel} — ${catalogItem.name}` : category!.id;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountCents,
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { firstName, lastName, phone, category: categoryMetadata, date, time, notes },
      success_url: `${request.nextUrl.origin}/debs/reservation-confirmee?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/debs?booking=annulee`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Debs checkout session creation failed:', error);
    return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 500 });
  }
}
