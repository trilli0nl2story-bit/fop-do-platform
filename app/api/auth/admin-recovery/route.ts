import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getSessionUserById, hashPassword, setSessionCookie } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

const DEFAULT_RECOVERY_EMAIL = 'urustau@gmail.com';

function getRecoveryEmail(): string {
  return (process.env.ADMIN_RECOVERY_EMAIL?.trim().toLowerCase() || DEFAULT_RECOVERY_EMAIL);
}

function getRecoveryCode(): string {
  return process.env.ADMIN_RECOVERY_CODE?.trim() || '';
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: NextRequest) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-admin-recovery',
    limit: 5,
    windowSeconds: 30 * 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(
      rate,
      'Слишком много попыток восстановления админ-доступа. Подождите немного и попробуйте снова.'
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const recoveryCode = typeof body.recoveryCode === 'string' ? body.recoveryCode.trim() : '';

  if (!email || !password || !recoveryCode) {
    return NextResponse.json(
      { error: 'Заполните email, новый пароль и recovery-код.' },
      { status: 400 }
    );
  }

  if (password.length < 10) {
    return NextResponse.json(
      { error: 'Новый пароль должен быть не короче 10 символов.' },
      { status: 400 }
    );
  }

  const expectedCode = getRecoveryCode();
  if (!expectedCode) {
    return NextResponse.json(
      { error: 'Recovery-код ещё не настроен на сервере.' },
      { status: 503 }
    );
  }

  if (email !== getRecoveryEmail()) {
    return NextResponse.json(
      { error: 'Для этого email аварийное восстановление не разрешено.' },
      { status: 403 }
    );
  }

  if (!safeEquals(recoveryCode, expectedCode)) {
    return NextResponse.json(
      { error: 'Неверный recovery-код.' },
      { status: 403 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);

    const result = await query<{ id: string }>(
      `
        INSERT INTO users (email, password_hash, is_admin, email_verified_at, created_at, updated_at)
        VALUES ($1, $2, true, now(), now(), now())
        ON CONFLICT (email)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          is_admin = true,
          email_verified_at = COALESCE(users.email_verified_at, now()),
          updated_at = now()
        RETURNING id
      `,
      [email, passwordHash]
    );

    const userId = result.rows[0]?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Не удалось восстановить доступ. Попробуйте ещё раз.' },
        { status: 500 }
      );
    }

    const sessionUser = await getSessionUserById(userId);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Не удалось создать сессию после восстановления.' },
        { status: 500 }
      );
    }

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({
      ok: true,
      redirectTo: '/admin',
      message: 'Доступ восстановлен. Вы вошли в аккаунт администратора.',
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('[api/auth/admin-recovery]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Ошибка сервера. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
