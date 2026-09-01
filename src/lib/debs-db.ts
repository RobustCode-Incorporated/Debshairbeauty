import { Pool } from 'pg';

const globalForDebsDb = globalThis as unknown as {
  debsPool: Pool | undefined;
};

const debsPool =
  globalForDebsDb.debsPool ??
  new Pool({
    connectionString: process.env.DEBS_DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDebsDb.debsPool = debsPool;
}

export default debsPool;
