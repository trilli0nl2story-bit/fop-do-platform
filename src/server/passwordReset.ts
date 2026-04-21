import { createHash, randomBytes } from 'node:crypto';
import { bumpUserSessionVersion, hashPassword } from './auth';
import { query } from './db';
import { sendEmail } from './email';

const TOKEN_TTL_HOURS = 2;

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
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token_hash text PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email text NOT NULL,
          expires_at timestamptz NOT NULL,
          consumed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
        ON password_reset_tokens (user_id, created_at DESC)
      `);
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }

  await tableReady;
}

export async function issuePasswordReset(params: {
  userId: string;
  email: string;
  requestOrigin?: string;
}): Promise<{ delivered: boolean; mode: 'smtp' | 'disabled' }> {
  await ensureTable();

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const appOrigin = getAppOrigin(params.requestOrigin);
  const resetUrl = `${appOrigin}/novyy-parol?token=${encodeURIComponent(token)}`;

  await query(
    `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1 OR expires_at < now() OR consumed_at IS NOT NULL
    `,
    [params.userId]
  );

  await query(
    `
      INSERT INTO password_reset_tokens (token_hash, user_id, email, expires_at)
      VALUES ($1, $2, $3, now() + interval '${TOKEN_TTL_HOURS} hours')
    `,
    [tokenHash, params.userId, params.email]
  );

  const subject = 'Сброс пароля для личного кабинета';
  const text = [
    'Здравствуйте!',
    '',
    'Мы получили запрос на смену пароля.',
    `Ссылка действует ${TOKEN_TTL_HOURS} часа(ов):`,
    resetUrl,
    '',
    'Если это были не вы, просто проигнорируйте письмо. Текущий пароль не изменится.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 16px">Сброс пароля</h2>
      <p style="margin:0 0 12px">
        Чтобы задать новый пароль, откройте страницу восстановления по кнопке ниже.
      </p>
      <p style="margin:0 0 20px">
        <a
          href="${resetUrl}"
          style="display:inline-block;padding:12px 18px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
        >
          Задать новый пароль
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#4b5563">
        Если кнопка не открывается, используйте ссылку:
      </p>
      <p style="margin:0 0 12px;font-size:14px;word-break:break-all;color:#2563eb">
        ${resetUrl}
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280">
        Ссылка действует ${TOKEN_TTL_HOURS} часа(ов). Если запрос отправили не вы, письмо можно проигнорировать.
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

export async function consumePasswordResetToken(params: {
  token: string;
  password: string;
}): Promise<{ ok: boolean; reason?: 'invalid' | 'expired' }> {
  await ensureTable();

  const tokenHash = hashToken(params.token);
  const tokenResult = await query<{
    user_id: string;
    expires_at: string;
    consumed_at: string | null;
  }>(
    `
      SELECT user_id, expires_at, consumed_at
      FROM password_reset_tokens
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

  const nextPasswordHash = await hashPassword(params.password);

  await query(
    `
      UPDATE users
      SET password_hash = $2,
          updated_at = now()
      WHERE id = $1
    `,
    [tokenRow.user_id, nextPasswordHash]
  );

  await bumpUserSessionVersion(tokenRow.user_id);

  await query(
    `
      UPDATE password_reset_tokens
      SET consumed_at = now()
      WHERE user_id = $1 AND consumed_at IS NULL
    `,
    [tokenRow.user_id]
  );

  return { ok: true };
}
