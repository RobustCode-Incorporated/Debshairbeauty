import { NextRequest, NextResponse } from 'next/server';
import { getDebsStripe } from '@/lib/debs-stripe';
import { getDebsProduct } from '@/lib/debs-products';

type CheckoutBody = {
  firstName: unknown;
  lastName: unknown;
  phone: unknown;
  productId: unknown;
  quantity?: unknown;
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
    const productId = asNonEmptyString(body.productId);
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    const quantity = Number.isInteger(body.quantity) && (body.quantity as number) > 0 ? (body.quantity as number) : 1;

    if (!firstName || !lastName || !phone || !productId) {
      return NextResponse.json(
        { error: 'Prénom, nom, téléphone et produit sont obligatoires.' },
        { status: 400 },
      );
    }
    if (!INTL_PHONE_RE.test(phone)) {
      return NextResponse.json(
        { error: 'Le numéro doit commencer par le code pays, ex : +32471234567' },
        { status: 400 },
      );
    }
    if (quantity > 10) {
      return NextResponse.json({ error: 'Quantité maximale : 10.' }, { status: 400 });
    }

    const product = getDebsProduct(productId);
    if (!product) {
      return NextResponse.json({ error: 'Produit inconnu.' }, { status: 400 });
    }
    if (product.placeholder) {
      return NextResponse.json(
        { error: 'Ce produit est un exemple provisoire, pas encore en vente.' },
        { status: 409 },
      );
    }

    const stripe = getDebsStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Le paiement par carte n'est pas encore configuré. Ajoute DEBS_STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }

    const unitAmountCents = Math.round(product.priceEuros * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: unitAmountCents,
            product_data: {
              name: `Debs Hair Beauty — ${product.name}${product.variant ? ` (${product.variant})` : ''}`,
              description: 'À récupérer au salon. Pas de livraison.',
            },
          },
          quantity,
        },
      ],
      metadata: {
        kind: 'product_order',
        firstName,
        lastName,
        phone,
        productId: product.id,
        productName: product.name,
        variant: product.variant ?? '',
        quantity: String(quantity),
        notes,
      },
      success_url: `${request.nextUrl.origin}/debs/commande-confirmee?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/debs?order=annulee`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Debs product checkout session creation failed:', error);
    return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 500 });
  }
}
