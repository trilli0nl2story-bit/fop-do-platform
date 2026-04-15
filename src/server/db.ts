/**
 * Server-only PostgreSQL connection helper.
 * Import only in API routes and server components — never in client components.
 *
 * Usage:
 *   import { query } from '@/src/server/db';
 *   const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
 *
 * SSL behaviour:
 *   - DATABASE_SSL=true  → always enable SSL (rejectUnauthorized: false)
 *   - DATABASE_SSL=false → always disable SSL
 *   - NODE_ENV=production → enable SSL unless DATABASE_SSL=false
 *   - Otherwise          → enable SSL only if DATABASE_URL contains sslmode=require
 */

import { Pool, QueryResultRow } from 'pg';

let pool: Pool | null = null;

function resolveSSL(url: string): { rejectUnauthorized: boolean } | false {
  const explicit = process.env.DATABASE_SSL;
  if (explicit === 'true') return { rejectUnauthorized: false };
  if (explicit === 'false') return false;
  // In production Next.js sets NODE_ENV=production automatically.
  if (process.env.NODE_ENV === 'production') return { rejectUnauthorized: false };
  // Fallback: honour sslmode=require in the URL.
  if (url.includes('sslmode=require')) return { rejectUnauthorized: false };
  return false;
}

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
      ssl: resolveSSL(url),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
      console.error('[db] Unexpected pool error:', err.constructor.name, err.message);
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
 * Logs the error class and message to the server console for diagnostics.
 */
export async function ping(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (err) {
    const e = err as Error;
    console.error('[db] ping failed:', e.constructor.name, '-', e.message);
    return false;
  }
}
