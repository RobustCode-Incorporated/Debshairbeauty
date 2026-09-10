import { NextRequest } from 'next/server';

/** Single shared-secret check for Déborah's admin tool — no login system exists. */
export function isDebsAdminAuthorized(request: NextRequest): boolean {
  const expected = process.env.DEBS_ADMIN_TOKEN;
  const auth = request.headers.get('authorization');
  return Boolean(expected) && auth === `Bearer ${expected}`;
}
