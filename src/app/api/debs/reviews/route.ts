import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import debsPool from '@/lib/debs-db';
import { getDebsResend, getDebsReviewFromAddress } from '@/lib/debs-email';
import { getGoogleWriteReviewUrl } from '@/lib/debs-google-reviews';
import { resolveLocale } from '@/lib/locale-url';

type ReviewBody = {
  token: unknown;
  rating: unknown;
  comment?: unknown;
  locale?: unknown;
};

type AppointmentRow = {
  id: string;
  category: string;
  first_name: string;
  last_name: string;
  phone: string;
};

const LOW_RATING_THRESHOLD = 4;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let locale = 'fr';
  try {
    const body = (await request.json()) as ReviewBody;
    locale = resolveLocale(body.locale);
    const t = await getTranslations({ locale, namespace: 'ReviewsApi' });

    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const rating = typeof body.rating === 'number' ? Math.round(body.rating) : NaN;
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : '';

    if (!token || !UUID_RE.test(token)) {
      return NextResponse.json({ error: t('invalidToken') }, { status: 404 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: t('invalidRating') }, { status: 400 });
    }

    const appointmentResult = await debsPool.query<AppointmentRow>(
      `SELECT a.id, a.category, c.first_name, c.last_name, c.phone
         FROM debs_appointments a
         JOIN debs_clients c ON c.id = a.client_id
        WHERE a.review_token = $1`,
      [token],
    );
    const appointment = appointmentResult.rows[0];
    if (!appointment) {
      return NextResponse.json({ error: t('invalidToken') }, { status: 404 });
    }

    const existingReview = await debsPool.query('SELECT 1 FROM debs_reviews WHERE appointment_id = $1', [appointment.id]);
    if (existingReview.rows.length > 0) {
      return NextResponse.json({ error: t('alreadySubmitted') }, { status: 409 });
    }

    await debsPool.query(
      'INSERT INTO debs_reviews (appointment_id, rating, comment) VALUES ($1, $2, $3)',
      [appointment.id, rating, comment || null],
    );

    if (rating >= LOW_RATING_THRESHOLD) {
      return NextResponse.json({ ok: true, googleUrl: getGoogleWriteReviewUrl() });
    }

    const resend = getDebsResend();
    const fromAddress = getDebsReviewFromAddress();
    const ownerEmail = process.env.DEBS_OWNER_EMAIL;
    if (resend && fromAddress && ownerEmail) {
      try {
        await resend.emails.send({
          from: fromAddress,
          to: ownerEmail,
          subject: `Avis ${rating}/5 à traiter — ${appointment.first_name} ${appointment.last_name}`,
          html: `
            <p><strong>Note :</strong> ${rating}/5</p>
            <p><strong>Client :</strong> ${appointment.first_name} ${appointment.last_name} — ${appointment.phone}</p>
            <p><strong>Prestation :</strong> ${appointment.category}</p>
            ${comment ? `<p><strong>Commentaire :</strong> ${comment}</p>` : '<p><em>Pas de commentaire laissé.</em></p>'}
          `,
        });
      } catch (error) {
        console.error('[DEBS_LOW_RATING_ALERT_FAILED]', error);
      }
    }

    return NextResponse.json({ ok: true, googleUrl: null });
  } catch (error) {
    console.error('Debs review submission failed:', error);
    const tCommon = await getTranslations({ locale, namespace: 'Common' });
    return NextResponse.json({ error: tCommon('genericError') }, { status: 500 });
  }
}
