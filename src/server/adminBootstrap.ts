import { hashPassword } from './auth';
import { ensureCoreAuthTables } from './coreSchema';
import { query, withTransaction } from './db';

interface BootstrapAdminInput {
  email: string;
  password: string;
  displayName?: string;
}

interface BootstrapAdminResult {
  mode: 'created' | 'updated';
  userId: string;
  email: string;
}

async function enablePgcryptoIfPossible(): Promise<void> {
  try {
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[admin-bootstrap] pgcrypto extension check skipped: ${message}`);
  }
}

export async function bootstrapAdminAccount(
  input: BootstrapAdminInput
): Promise<BootstrapAdminResult> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName?.trim() || 'Admin';

  await enablePgcryptoIfPossible();
  await ensureCoreAuthTables();

  const passwordHash = await hashPassword(input.password);

  return withTransaction(async (client) => {
    const existing = await client.query<{ id: string }>(
      'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );

    let mode: BootstrapAdminResult['mode'] = 'updated';
    let userId = existing.rows[0]?.id;

    if (userId) {
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
      const created = await client.query<{ id: string }>(
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

    return { mode, userId, email };
  });
}
