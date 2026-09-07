import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import debsPool from '@/lib/debs-db';
import { getDebsResend, getDebsReviewFromAddress } from '@/lib/debs-email';
import { localizedPath, DEBS_SITE_URL } from '@/lib/locale-url';

// A booking is presumed finished 3h after its start — generous enough to
// cover every service in the catalogue (see debs-catalog.ts durations)
// without a fragile per-service lookup from the free-text `category` column.
const COMPLETED_AFTER_HOURS = 3;
const BATCH_LIMIT = 200;

type Row = {
  id: string;
  email: string;
  locale: string;
  review_token: string;
  first_name: string;
};

/**
 * Runs daily (see vercel.json). Emails a private review-rating link for
 * every paid, non-cancelled appointment old enough to be finished that
 * hasn't been asked yet. Protected by Vercel's automatic CRON_SECRET bearer
 * auth — https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const resend = getDebsResend();
  const fromAddress = getDebsReviewFromAddress();
  if (!resend || !fromAddress) {
    return NextResponse.json({ error: 'Resend not configured (RESEND_API_KEY / DEBS_REVIEW_FROM_EMAIL).' }, { status: 503 });
  }

  const due = await debsPool.query<Row>(
    `SELECT a.id, a.email, a.locale, a.review_token, c.first_name
       FROM debs_appointments a
       JOIN debs_clients c ON c.id = a.client_id
      WHERE a.payment_status = 'PAID'
        AND a.status != 'CANCELLED'
        AND a.email IS NOT NULL
        AND a.review_email_sent_at IS NULL
        AND a.date_time < now() - ($1 * interval '1 hour')
      ORDER BY a.date_time ASC
      LIMIT $2`,
    [COMPLETED_AFTER_HOURS, BATCH_LIMIT],
  );

  const translationsByLocale = new Map<string, Awaited<ReturnType<typeof getTranslations>>>();
  let sent = 0;
  let failed = 0;

  for (const row of due.rows) {
    try {
      let t = translationsByLocale.get(row.locale);
      if (!t) {
        t = await getTranslations({ locale: row.locale, namespace: 'ReviewEmail' });
        translationsByLocale.set(row.locale, t);
      }

      const reviewUrl = `${DEBS_SITE_URL}${localizedPath('/debs/avis', row.locale)}?token=${row.review_token}`;
      const { error } = await resend.emails.send({
        from: fromAddress,
        to: row.email,
        subject: t('subject'),
        html: `
          <p>${t('greeting', { firstName: row.first_name })}</p>
          <p>${t('body')}</p>
          <p><a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;background:#1c1917;color:#fff;text-decoration:none;font-weight:bold;">${t('cta')}</a></p>
        `,
      });
      if (error) throw new Error(error.message);

      await debsPool.query('UPDATE debs_appointments SET review_email_sent_at = now() WHERE id = $1', [row.id]);
      sent += 1;
    } catch (error) {
      console.error(`[DEBS_REVIEW_EMAIL_FAILED] appointment ${row.id}:`, error);
      failed += 1;
    }
  }

  return NextResponse.json({ checked: due.rows.length, sent, failed });
}
