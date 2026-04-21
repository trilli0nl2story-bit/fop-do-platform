import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptchaToken } from '@/src/server/captcha';
import { query } from '@/src/server/db';
import { issuePasswordReset } from '@/src/server/passwordReset';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

const GENERIC_MESSAGE =
  'Если аккаунт с таким email существует, мы отправили письмо со ссылкой для смены пароля.';

export async function POST(request: NextRequest) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
  }

  const captchaResult = await verifyCaptchaToken(request, body.captchaToken);
  if (!captchaResult.ok) {
    return NextResponse.json(
      { error: captchaResult.message ?? 'Не удалось пройти проверку.' },
      { status: 400 }
    );
  }

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-password-reset-request',
    limit: 5,
    windowSeconds: 60 * 60,
    keyParts: [email],
  });
  if (!rate.allowed) {
    return rateLimitResponse(
      rate,
      'Слишком много запросов на восстановление. Подождите немного и попробуйте ещё раз.'
    );
  }

  try {
    const result = await query<{ id: string; email: string }>(
      `
        SELECT id, email
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    const user = result.rows[0];
    if (user) {
      try {
        await issuePasswordReset({
          userId: user.id,
          email: user.email,
          requestOrigin: new URL(request.url).origin,
        });
      } catch (emailError) {
        console.error(
          '[api/auth/password-reset/request] failed',
          emailError instanceof Error ? emailError.message : String(emailError)
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error('[api/auth/password-reset/request]', error);
    return NextResponse.json(
      { error: 'Ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
