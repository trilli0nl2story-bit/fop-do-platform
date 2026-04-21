import { createHash, randomBytes } from 'node:crypto';
import { query } from './db';
import { sendEmail } from './email';

const TOKEN_TTL_HOURS = 24;

let tableReady: Promise<void> | null = null;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getAppOrigin(requestOrigin?: string): string {
  const configured =
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (requestOrigin) {
    return requestOrigin.replace(/\/+$/, '');
  }

  return 'http://localhost:5000';
}

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          token_hash text PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email text NOT NULL,
          expires_at timestamptz NOT NULL,
          consumed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx
        ON email_verification_tokens (user_id, created_at DESC)
      `);
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }

  await tableReady;
}

export async function issueEmailVerification(params: {
  userId: string;
  email: string;
  requestOrigin?: string;
}): Promise<{ delivered: boolean; mode: 'smtp' | 'disabled' }> {
  await ensureTable();

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const appOrigin = getAppOrigin(params.requestOrigin);
  const verificationUrl = `${appOrigin}/podtverzhdenie-email?token=${encodeURIComponent(token)}`;

  await query(
    `
      DELETE FROM email_verification_tokens
      WHERE user_id = $1 OR expires_at < now() OR consumed_at IS NOT NULL
    `,
    [params.userId]
  );

  await query(
    `
      INSERT INTO email_verification_tokens (token_hash, user_id, email, expires_at)
      VALUES ($1, $2, $3, now() + interval '${TOKEN_TTL_HOURS} hours')
    `,
    [tokenHash, params.userId, params.email]
  );

  const subject = 'Подтвердите email для входа в кабинет';
  const text = [
    'Здравствуйте!',
    '',
    'Подтвердите email, чтобы завершить настройку вашего кабинета.',
    `Ссылка действует ${TOKEN_TTL_HOURS} часа(ов):`,
    verificationUrl,
    '',
    'Если это были не вы, просто проигнорируйте письмо.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 16px">Подтвердите email</h2>
      <p style="margin:0 0 12px">
        Чтобы завершить настройку кабинета, подтвердите ваш email.
      </p>
      <p style="margin:0 0 20px">
        <a
          href="${verificationUrl}"
          style="display:inline-block;padding:12px 18px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
        >
          Подтвердить email
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#4b5563">
        Если кнопка не открывается, используйте ссылку:
      </p>
      <p style="margin:0 0 12px;font-size:14px;word-break:break-all;color:#2563eb">
        ${verificationUrl}
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280">
        Ссылка действует ${TOKEN_TTL_HOURS} часа(ов). Если это были не вы, письмо можно проигнорировать.
      </p>
    </div>
  `;

  return sendEmail({
    to: params.email,
    subject,
    text,
    html,
  });
}

export async function consumeEmailVerificationToken(token: string): Promise<{
  ok: boolean;
  reason?: 'invalid' | 'expired';
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
    emailVerified: boolean;
  };
}> {
  await ensureTable();

  const tokenHash = hashToken(token);
  const tokenResult = await query<{
    user_id: string;
    email: string;
    expires_at: string;
    consumed_at: string | null;
  }>(
    `
      SELECT user_id, email, expires_at, consumed_at
      FROM email_verification_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  const tokenRow = tokenResult.rows[0];
  if (!tokenRow) {
    return { ok: false, reason: 'invalid' };
  }

  if (tokenRow.consumed_at || new Date(tokenRow.expires_at) <= new Date()) {
    return { ok: false, reason: 'expired' };
  }

  await query(
    `
      UPDATE email_verification_tokens
      SET consumed_at = now()
      WHERE token_hash = $1 AND consumed_at IS NULL
    `,
    [tokenHash]
  );

  const userResult = await query<{
    id: string;
    email: string;
    is_admin: boolean;
    email_verified_at: string | null;
  }>(
    `
      UPDATE users
      SET email_verified_at = COALESCE(email_verified_at, now()),
          updated_at = now()
      WHERE id = $1
      RETURNING id, email, is_admin, email_verified_at
    `,
    [tokenRow.user_id]
  );

  const user = userResult.rows[0];
  if (!user) {
    return { ok: false, reason: 'invalid' };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      emailVerified: Boolean(user.email_verified_at),
    },
  };
}
