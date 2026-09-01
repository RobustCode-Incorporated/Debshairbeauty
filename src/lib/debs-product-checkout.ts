import Stripe from 'stripe';
import debsPool from '@/lib/debs-db';

export type DebsProductCheckoutMetadata = {
  kind: 'product_order';
  firstName: string;
  lastName: string;
  phone: string;
  productId: string;
  productName: string;
  variant: string;
  quantity: string;
  notes: string;
};

export type DebsProductFulfillmentResult = {
  orderId: string;
  whatsappUrl: string | null;
  firstName: string;
  productName: string;
  variant: string;
  quantity: number;
};

function normalizeWhatsappNumber(input: string): string {
  return input.replace(/[^\d]/g, '');
}

function buildWhatsappUrl(orderId: string, meta: DebsProductCheckoutMetadata): string | null {
  if (!process.env.DEBS_WHATSAPP_NUMBER) return null;
  const digits = normalizeWhatsappNumber(process.env.DEBS_WHATSAPP_NUMBER);
  if (!digits) return null;

  const message = [
    '*Commande payee - Debs Hair Beauty*',
    `- Nom: ${meta.firstName} ${meta.lastName}`,
    `- Telephone: ${meta.phone}`,
    `- Produit: ${meta.productName}${meta.variant ? ` (${meta.variant})` : ''}`,
    `- Quantite: ${meta.quantity}`,
    `- ID commande: ${orderId}`,
    meta.notes ? `- Notes: ${meta.notes}` : null,
    '- Paiement deja regle par carte (Stripe). A recuperer au salon.',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Idempotent, same pattern as `fulfillDebsCheckout`: safe to call from both
 * the shared Stripe webhook and the success-page fallback for the same
 * session — the unique constraint on `stripe_session_id` guarantees a
 * single order row no matter which caller wins the race.
 */
export async function fulfillDebsProductOrder(session: Stripe.Checkout.Session): Promise<DebsProductFulfillmentResult | null> {
  if (session.payment_status !== 'paid') return null;

  const meta = session.metadata as unknown as DebsProductCheckoutMetadata | null;
  if (!meta?.firstName || !meta.lastName || !meta.phone || !meta.productId || !meta.productName || !meta.quantity) {
    throw new Error(`Debs product order session ${session.id} is paid but missing order metadata.`);
  }

  const existing = await debsPool.query<{ id: string }>(
    'SELECT id FROM debs_orders WHERE stripe_session_id = $1',
    [session.id],
  );
  if (existing.rows[0]) {
    return {
      orderId: existing.rows[0].id,
      whatsappUrl: buildWhatsappUrl(existing.rows[0].id, meta),
      firstName: meta.firstName,
      productName: meta.productName,
      variant: meta.variant,
      quantity: Number(meta.quantity),
    };
  }

  const clientResult = await debsPool.query<{ id: string }>(
    `INSERT INTO debs_clients (first_name, last_name, phone)
     VALUES ($1, $2, $3)
     ON CONFLICT (phone) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
     RETURNING id`,
    [meta.firstName, meta.lastName, meta.phone],
  );
  const clientId = clientResult.rows[0].id;

  const quantity = Number(meta.quantity);
  const amountCents = session.amount_total ?? 0;
  const unitPriceCents = quantity > 0 ? Math.round(amountCents / quantity) : amountCents;
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  const orderResult = await debsPool.query<{ id: string }>(
    `INSERT INTO debs_orders
       (client_id, product_id, product_name, variant, quantity, unit_price_cents, amount_cents, currency, payment_status, notes, stripe_session_id, stripe_payment_intent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PAID', $9, $10, $11)
     ON CONFLICT (stripe_session_id) DO NOTHING
     RETURNING id`,
    [
      clientId,
      meta.productId,
      meta.productName,
      meta.variant || null,
      quantity,
      unitPriceCents,
      amountCents,
      session.currency ?? 'eur',
      meta.notes || null,
      session.id,
      paymentIntentId,
    ],
  );

  const orderId = orderResult.rows[0]?.id
    ?? (await debsPool.query<{ id: string }>('SELECT id FROM debs_orders WHERE stripe_session_id = $1', [session.id])).rows[0].id;

  return {
    orderId,
    whatsappUrl: buildWhatsappUrl(orderId, meta),
    firstName: meta.firstName,
    productName: meta.productName,
    variant: meta.variant,
    quantity,
  };
}
