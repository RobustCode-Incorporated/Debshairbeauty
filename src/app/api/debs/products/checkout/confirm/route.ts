import { NextRequest, NextResponse } from 'next/server';
import { getDebsStripe } from '@/lib/debs-stripe';
import { fulfillDebsProductOrder } from '@/lib/debs-product-checkout';

// Fallback fulfillment for the success page, same pattern as
// `/api/debs/checkout/confirm`: Stripe's webhook is the primary path, but
// it's async, so this route retrieves the session directly and runs the
// same idempotent fulfillment.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id manquant.' }, { status: 400 });
  }

  const stripe = getDebsStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configuré pour Debs Hair Beauty.' }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirmé pour cette session.' }, { status: 409 });
    }

    const result = await fulfillDebsProductOrder(session);
    if (!result) {
      return NextResponse.json({ error: 'Paiement non confirmé pour cette session.' }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Debs product order confirmation failed:', error);
    return NextResponse.json({ error: 'Impossible de confirmer la commande.' }, { status: 500 });
  }
}
