import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getDebsStripe } from '@/lib/debs-stripe';
import { getDebsCategory } from '@/lib/debs-services';
import { getDebsCatalogItem } from '@/lib/debs-catalog';
import { localizedPath, resolveLocale } from '@/lib/locale-url';

type CheckoutBody = {
  firstName: unknown;
  lastName: unknown;
  phone: unknown;
  category: unknown;
  serviceId?: unknown;
  date: unknown;
  time: unknown;
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
    const [t, tCommon, tBooking, tCatalogCategories, tCatalogItems, tServiceCategories] = await Promise.all([
      getTranslations({ locale, namespace: 'CheckoutApi' }),
      getTranslations({ locale, namespace: 'Common' }),
      getTranslations({ locale, namespace: 'Booking' }),
      getTranslations({ locale, namespace: 'CatalogCategories' }),
      getTranslations({ locale, namespace: 'CatalogItems' }),
      getTranslations({ locale, namespace: 'ServiceCategories' }),
    ]);

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
      return NextResponse.json({ error: t('unknownService') }, { status: 400 });
    }
    if (!firstName || !lastName || !phone || !date || !time || (!catalogItem && !category)) {
      return NextResponse.json(
        { error: t('missingRequiredFieldsBooking') },
        { status: 400 },
      );
    }
    if (!INTL_PHONE_RE.test(phone)) {
      return NextResponse.json(
        { error: tCommon('invalidPhone') },
        { status: 400 },
      );
    }

    const dateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: tBooking('errors.invalidDateTime') }, { status: 400 });
    }
    if (dateTime.getTime() < Date.now()) {
      return NextResponse.json({ error: tBooking('errors.futureSlotRequired') }, { status: 400 });
    }
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      return NextResponse.json(
        { error: tBooking('errors.closedDay') },
        { status: 400 },
      );
    }

    const stripe = getDebsStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: t('stripeNotConfigured') },
        { status: 503 },
      );
    }

    const amountEuros = catalogItem ? catalogItem.priceEuros : category!.minPriceEuros;
    const amountCents = Math.round(amountEuros * 100);
    const catalogItemName = catalogItem ? tCatalogItems(catalogItem.id) : null;
    const catalogItemCategory = catalogItem ? tCatalogCategories(catalogItem.categoryLabel) : null;
    const categoryName = category ? tServiceCategories(category.id) : null;
    const productName = catalogItem
      ? t('bookingProductName', { name: catalogItemName! })
      : t('bookingDepositProductName', { category: categoryName! });
    const productDescription = catalogItem
      ? t('bookingServiceDescription', { name: catalogItemName!, category: catalogItemCategory! })
      : t('bookingDepositDescription');
    const categoryMetadata = catalogItem ? `${catalogItem.categoryLabel} — ${catalogItem.name}` : category!.id;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      locale: locale as 'fr' | 'en' | 'nl' | 'es',
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
      success_url: `${request.nextUrl.origin}${localizedPath('/debs/reservation-confirmee', locale)}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}${localizedPath('/debs', locale)}?booking=annulee`,
    });

    if (!session.url) {
      return NextResponse.json({ error: tCommon('checkoutFailed') }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Debs checkout session creation failed:', error);
    const tCommon = await getTranslations({ locale, namespace: 'Common' });
    return NextResponse.json({ error: tCommon('checkoutFailed') }, { status: 500 });
  }
}
