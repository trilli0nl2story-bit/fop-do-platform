import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/server/db';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from '@/src/server/auth';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export async function POST(req: NextRequest) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;

  const ipRate = await consumeRequestRateLimit(req, {
    scope: 'auth-login-ip',
    limit: 12,
    windowSeconds: 10 * 60,
  });
  if (!ipRate.allowed) {
    return rateLimitResponse(
      ipRate,
      'Слишком много попыток входа. Подождите немного и попробуйте ещё раз.'
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const { email, password } = body;

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
  }
  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Пароль обязателен' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const credentialRate = await consumeRequestRateLimit(req, {
    scope: 'auth-login-email',
    limit: 6,
    windowSeconds: 10 * 60,
    keyParts: [normalizedEmail],
  });
  if (!credentialRate.allowed) {
    return rateLimitResponse(
      credentialRate,
      'Слишком много попыток входа для этого email. Подождите немного и попробуйте ещё раз.'
    );
  }

  try {
    const { rows } = await query<{
      id: string;
      email: string;
      password_hash: string;
      is_admin: boolean;
    }>(
      'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = rows[0];

    const dummyHash =
      '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const passwordHash = user?.password_hash ?? dummyHash;
    const passwordValid = await verifyPassword(password, passwordHash);

    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, isAdmin: user.is_admin },
    });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[api/auth/login]', err);
    return NextResponse.json(
      { error: 'Ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
