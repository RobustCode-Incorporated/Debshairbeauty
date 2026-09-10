import { NextRequest, NextResponse } from 'next/server';
import debsPool from '@/lib/debs-db';
import { isDebsAdminAuthorized } from '@/lib/debs-admin-auth';

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
};

/** Client search for the "add manual appointment" form — lets Déborah find an existing client by name/phone instead of re-typing it. */
export async function GET(request: NextRequest) {
  if (!isDebsAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ clients: [] });
  }

  const result = await debsPool.query<Row>(
    `SELECT id, first_name, last_name, phone
       FROM debs_clients
      WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1
      ORDER BY first_name ASC
      LIMIT 8`,
    [`%${q}%`],
  );

  return NextResponse.json({
    clients: result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
    })),
  });
}
