/**
 * Server-only PostgreSQL connection helper.
 * Import only in API routes and server components — never in client components.
 *
 * Usage:
 *   import { query } from '@/src/server/db';
 *   const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
 */

import { Pool, QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        '[db] DATABASE_URL is not set. ' +
        'Add it to your .env.local file or environment secrets.'
      );
    }
    pool = new Pool({
      connectionString: url,
      ssl: url.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
      console.error('[db] Unexpected pool error', err);
    });
  }
  return pool;
}

/**
 * Execute a parameterized SQL query.
 * The pool is initialized lazily on first call so that builds without
 * DATABASE_URL still succeed.
 */
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = getPool();
  const result = await client.query<T>(text, params);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}

/**
 * Check whether a live database connection can be established.
 * Returns true on success, false on any error.
 */
export async function ping(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
