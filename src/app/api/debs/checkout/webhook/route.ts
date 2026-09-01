import { NextRequest, NextResponse } from 'next/server';
import { getDebsStripe } from '@/lib/debs-stripe';
import { fulfillDebsCheckout } from '@/lib/debs-checkout';
import { fulfillDebsProductOrder } from '@/lib/debs-product-checkout';

export async function POST(request: NextRequest) {
  const stripe = getDebsStripe();
  if (!stripe || !process.env.DEBS_STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe non configuré pour Debs Hair Beauty.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.DEBS_STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Debs Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      if (session.metadata?.kind === 'product_order') {
        await fulfillDebsProductOrder(session);
      } else {
        await fulfillDebsCheckout(session);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Debs checkout fulfillment failed:', error);
    return NextResponse.json({ error: 'Fulfillment failed.' }, { status: 500 });
  }
}
