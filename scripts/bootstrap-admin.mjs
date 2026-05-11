#!/usr/bin/env node

import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const CONFIRM_PHRASE = 'PROMOTE_OWNER_ADMIN';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function resolveSSL(url) {
  const explicit = process.env.DATABASE_SSL;
  if (explicit === 'true') return { rejectUnauthorized: false };
  if (explicit === 'false') return false;
  if (process.env.NODE_ENV === 'production') return { rejectUnauthorized: false };
  if (url.includes('sslmode=require')) return { rejectUnauthorized: false };
  return false;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function enablePgcryptoIfPossible(client) {
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[bootstrap-admin] pgcrypto extension check skipped: ${message}`);
  }
}

async function ensureCoreAuthTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL DEFAULT '',
      is_admin boolean NOT NULL DEFAULT false,
      email_verified_at timestamptz NULL,
      session_version integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT ''");
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz NULL');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
  await client.query('CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)');

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL DEFAULT '',
      last_name text NOT NULL DEFAULT '',
      patronymic text NOT NULL DEFAULT '',
      role text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      institution text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT ''");
  await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT ''");
  await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS patronymic text NOT NULL DEFAULT ''");
  await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT ''");
  await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT ''");
  await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS institution text NOT NULL DEFAULT ''");
  await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT ''");
  await client.query('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
}

async function main() {
  if (process.env.ADMIN_BOOTSTRAP_ENABLED !== 'true') {
    throw new Error('ADMIN_BOOTSTRAP_ENABLED must be true for this one-time operation');
  }

  const confirm = requiredEnv('ADMIN_BOOTSTRAP_CONFIRM');
  if (confirm !== CONFIRM_PHRASE) {
    throw new Error(`ADMIN_BOOTSTRAP_CONFIRM must equal ${CONFIRM_PHRASE}`);
  }

  const databaseUrl = requiredEnv('DATABASE_URL');
  const email = requiredEnv('ADMIN_BOOTSTRAP_EMAIL').toLowerCase();
  const password = requiredEnv('ADMIN_BOOTSTRAP_PASSWORD');
  const displayName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Admin';

  if (!validateEmail(email)) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email');
  }

  if (password.length < 12) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: resolveSSL(databaseUrl),
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });

  const client = await pool.connect();
  try {
    await enablePgcryptoIfPossible(client);
    await client.query('BEGIN');
    await ensureCoreAuthTables(client);

    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await client.query(
      'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );

    let mode = 'updated';
    let userId;

    if (existing.rows[0]?.id) {
      userId = existing.rows[0].id;
      await client.query(
        `
          UPDATE users
          SET email = $1,
              password_hash = $2,
              is_admin = true,
              email_verified_at = COALESCE(email_verified_at, now()),
              session_version = session_version + 1,
              updated_at = now()
          WHERE id = $3
        `,
        [email, passwordHash, userId]
      );
    } else {
      mode = 'created';
      const created = await client.query(
        `
          INSERT INTO users (email, password_hash, is_admin, email_verified_at, created_at, updated_at)
          VALUES ($1, $2, true, now(), now(), now())
          RETURNING id
        `,
        [email, passwordHash]
      );
      userId = created.rows[0].id;
    }

    await client.query(
      `
        INSERT INTO user_profiles (id, name, role, city, updated_at)
        VALUES ($1, $2, 'Admin', '', now())
        ON CONFLICT (id) DO UPDATE
        SET name = COALESCE(NULLIF(user_profiles.name, ''), EXCLUDED.name),
            role = COALESCE(NULLIF(user_profiles.role, ''), EXCLUDED.role),
            updated_at = now()
      `,
      [userId, displayName]
    );

    await client.query('COMMIT');

    console.log(`Admin bootstrap ${mode}: ${email}`);
    console.log(`User id: ${userId}`);
    console.log('Next: remove ADMIN_BOOTSTRAP_* secrets and sign in with the new password.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[bootstrap-admin] failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
