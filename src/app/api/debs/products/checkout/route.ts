import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getDebsStripe } from '@/lib/debs-stripe';
import { getDebsProduct } from '@/lib/debs-products';
import { localizedPath, resolveLocale } from '@/lib/locale-url';

type CheckoutBody = {
  firstName: unknown;
  lastName: unknown;
  phone: unknown;
  productId: unknown;
  quantity?: unknown;
  notes?: unknown;
  locale?: unknown;
};

const INTL_PHONE_RE = /^\+\d{7,15}$/;

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  let locale = 'fr';
  try {
    const body = (await request.json()) as CheckoutBody;
    locale = resolveLocale(body.locale);
    const [t, tCommon, tProducts] = await Promise.all([
      getTranslations({ locale, namespace: 'CheckoutApi' }),
      getTranslations({ locale, namespace: 'Common' }),
      getTranslations({ locale, namespace: 'Products' }),
    ]);

    const firstName = asNonEmptyString(body.firstName);
    const lastName = asNonEmptyString(body.lastName);
    const phone = asNonEmptyString(body.phone);
    const productId = asNonEmptyString(body.productId);
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    const quantity = Number.isInteger(body.quantity) && (body.quantity as number) > 0 ? (body.quantity as number) : 1;

    if (!firstName || !lastName || !phone || !productId) {
      return NextResponse.json(
        { error: t('missingRequiredFieldsPurchase') },
        { status: 400 },
      );
    }
    if (!INTL_PHONE_RE.test(phone)) {
      return NextResponse.json(
        { error: tCommon('invalidPhone') },
        { status: 400 },
      );
    }
    if (quantity > 10) {
      return NextResponse.json({ error: t('maxQuantity') }, { status: 400 });
    }

    const product = getDebsProduct(productId);
    if (!product) {
      return NextResponse.json({ error: t('unknownProduct') }, { status: 400 });
    }
    if (product.placeholder) {
      return NextResponse.json(
        { error: t('placeholderProduct') },
        { status: 409 },
      );
    }

    const stripe = getDebsStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: t('stripeNotConfigured') },
        { status: 503 },
      );
    }

    const unitAmountCents = Math.round(product.priceEuros * 100);
    const productName = tProducts(`${product.id}.name`);
    const productVariant = product.variant ? tProducts(`${product.id}.variant`) : '';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      locale: locale as 'fr' | 'en' | 'nl' | 'es',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: unitAmountCents,
            product_data: {
              name: `Debs Hair Beauty — ${productName}${productVariant ? ` (${productVariant})` : ''}`,
              description: t('productDescription'),
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
      success_url: `${request.nextUrl.origin}${localizedPath('/debs/commande-confirmee', locale)}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}${localizedPath('/debs', locale)}?order=annulee`,
    });

    if (!session.url) {
      return NextResponse.json({ error: tCommon('checkoutFailed') }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Debs product checkout session creation failed:', error);
    const tCommon = await getTranslations({ locale, namespace: 'Common' });
    return NextResponse.json({ error: tCommon('checkoutFailed') }, { status: 500 });
  }
}
