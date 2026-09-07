import { Resend } from 'resend';

let cachedClient: Resend | null = null;

export function getDebsResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new Resend(process.env.RESEND_API_KEY);
  }
  return cachedClient;
}

/** `"Debs Hair Beauty <...>"` sender — the address must be on a domain verified in Resend. */
export function getDebsReviewFromAddress(): string | null {
  const address = process.env.DEBS_REVIEW_FROM_EMAIL;
  return address ? `Debs Hair Beauty <${address}>` : null;
}
