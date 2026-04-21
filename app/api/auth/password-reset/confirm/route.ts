import { NextRequest, NextResponse } from 'next/server';
import { consumePasswordResetToken } from '@/src/server/passwordReset';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-password-reset-confirm',
    limit: 10,
    windowSeconds: 30 * 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(
      rate,
      'Слишком много попыток смены пароля. Подождите немного и попробуйте ещё раз.'
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { token?: string; password?: string }
    | null;

  const token = body?.token?.trim() ?? '';
  const password = body?.password ?? '';

  if (!token) {
    return NextResponse.json(
      { error: 'Ссылка для восстановления недействительна.' },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Пароль должен содержать не менее 8 символов.' },
      { status: 400 }
    );
  }

  const result = await consumePasswordResetToken({ token, password });
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === 'expired'
            ? 'Ссылка для восстановления устарела. Запросите новую.'
            : 'Ссылка для восстановления недействительна.',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    redirectTo: '/vhod?passwordReset=success',
  });
}
