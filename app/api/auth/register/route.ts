import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/server/db';
import {
  hashPassword,
  createSessionToken,
  setSessionCookie,
} from '@/src/server/auth';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';
import { verifyCaptchaToken } from '@/src/server/captcha';
import { issueEmailVerification } from '@/src/server/emailVerification';

export async function POST(req: NextRequest) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;

  const ipRate = await consumeRequestRateLimit(req, {
    scope: 'auth-register-ip',
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!ipRate.allowed) {
    return rateLimitResponse(
      ipRate,
      'Слишком много регистраций с этого адреса. Подождите немного и попробуйте ещё раз.'
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const captchaResult = await verifyCaptchaToken(req, body.captchaToken);
  if (!captchaResult.ok) {
    return NextResponse.json(
      { error: captchaResult.message ?? 'Не удалось пройти проверку.' },
      { status: 400 }
    );
  }

  const { name, role, city, email, password } = body;

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Пароль должен содержать не менее 8 символов' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRate = await consumeRequestRateLimit(req, {
    scope: 'auth-register-email',
    limit: 3,
    windowSeconds: 60 * 60,
    keyParts: [normalizedEmail],
  });
  if (!emailRate.allowed) {
    return rateLimitResponse(
      emailRate,
      'Слишком много попыток регистрации для этого email. Подождите немного и попробуйте ещё раз.'
    );
  }

  try {
    const { rows: existing } = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже зарегистрирован' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const {
      rows: [user],
    } = await query<{
      id: string;
      email: string;
      is_admin: boolean;
    }>(
      `
        INSERT INTO users (email, password_hash, is_admin, email_verified_at, created_at, updated_at)
        VALUES ($1, $2, false, null, now(), now())
        RETURNING id, email, is_admin
      `,
      [normalizedEmail, passwordHash]
    );

    await query(
      `
        INSERT INTO user_profiles (id, name, role, city, updated_at)
        VALUES ($1, $2, $3, $4, now())
      `,
      [
        user.id,
        typeof name === 'string' ? name.trim() : '',
        typeof role === 'string' ? role.trim() : '',
        typeof city === 'string' ? city.trim() : '',
      ]
    );

    let delivery: { delivered: boolean; mode: 'smtp' | 'disabled' } = {
      delivered: false,
      mode: 'disabled',
    };
    try {
      delivery = await issueEmailVerification({
        userId: user.id,
        email: user.email,
        requestOrigin: new URL(req.url).origin,
      });
    } catch (emailError) {
      console.error(
        '[api/auth/register] verification email failed',
        emailError instanceof Error ? emailError.message : String(emailError)
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      emailVerified: false,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.is_admin,
          emailVerified: false,
        },
        verification: {
          sent: delivery.delivered,
          deliveryMode: delivery.mode,
        },
      },
      { status: 201 }
    );
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[api/auth/register]', err);
    return NextResponse.json(
      { error: 'Ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
