// Applies prisma/debs/schema.sql to DEBS_DATABASE_URL and seeds the initial
// staff record (Deborah). Idempotent: safe to re-run.
//
// Usage: npx tsx prisma/debs/migrate.ts

import 'dotenv/config';
import { readFileSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DEBS_DATABASE_URL;
  if (!connectionString) {
    throw new Error('DEBS_DATABASE_URL is not set. Add it to .env before running this script.');
  }

  const pool = new Pool({ connectionString });

  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');
    await pool.query(schemaSql);
    console.log('[debs] schema.sql applied.');

    const existing = await pool.query('SELECT id FROM debs_staff LIMIT 1');
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO debs_staff (first_name, last_name, role) VALUES ($1, $2, $3)`,
        ['Déborah', '', 'Coiffeuse, esthéticienne, maquilleuse'],
      );
      console.log('[debs] seeded staff: Déborah.');
    } else {
      console.log('[debs] staff already seeded, skipping.');
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[debs] migration failed:', error);
  process.exit(1);
});
