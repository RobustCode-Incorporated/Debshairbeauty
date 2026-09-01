import Stripe from 'stripe';

let cachedClient: Stripe | null = null;

export function getDebsStripe(): Stripe | null {
  if (!process.env.DEBS_STRIPE_SECRET_KEY) return null;
  if (!cachedClient) {
    cachedClient = new Stripe(process.env.DEBS_STRIPE_SECRET_KEY);
  }
  return cachedClient;
}
