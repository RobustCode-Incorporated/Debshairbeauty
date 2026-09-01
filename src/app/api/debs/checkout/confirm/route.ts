import { NextRequest, NextResponse } from 'next/server';
import { getDebsStripe } from '@/lib/debs-stripe';
import { fulfillDebsCheckout } from '@/lib/debs-checkout';

// Fallback fulfillment for the success page: Stripe's webhook is the primary
// path, but it's async and can arrive after the browser lands here. This
// route retrieves the session directly and runs the same idempotent
// fulfillment, so the confirmation page never has to hang waiting on a webhook.
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

    const result = await fulfillDebsCheckout(session);
    if (!result) {
      return NextResponse.json({ error: 'Paiement non confirmé pour cette session.' }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Debs checkout confirmation failed:', error);
    return NextResponse.json({ error: 'Impossible de confirmer la réservation.' }, { status: 500 });
  }
}
