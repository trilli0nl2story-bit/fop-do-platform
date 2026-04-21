import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';
import { issueEmailVerification } from '@/src/server/emailVerification';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-verify-email-resend',
    limit: 5,
    windowSeconds: 60 * 60,
    keyParts: [sessionUser.id, sessionUser.email],
  });
  if (!rate.allowed) {
    return rateLimitResponse(
      rate,
      'Слишком много повторных отправок. Подождите немного и попробуйте ещё раз.'
    );
  }

  const result = await query<{
    id: string;
    email: string;
    is_admin: boolean;
    email_verified_at: string | null;
  }>(
    `
      SELECT id, email, is_admin, email_verified_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [sessionUser.id]
  );

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.email_verified_at) {
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      message: 'Почта уже подтверждена.',
    });
  }

  let delivery: { delivered: boolean; mode: 'smtp' | 'disabled' } = {
    delivered: false,
    mode: 'disabled',
  };
  try {
    delivery = await issueEmailVerification({
      userId: user.id,
      email: user.email,
      requestOrigin: new URL(request.url).origin,
    });
  } catch (emailError) {
    console.error(
      '[api/auth/verify-email/resend] failed',
      emailError instanceof Error ? emailError.message : String(emailError)
    );
  }

  return NextResponse.json({
    ok: true,
    deliveryMode: delivery.mode,
    delivered: delivery.delivered,
    message: delivery.delivered
      ? 'Письмо для подтверждения отправлено.'
      : 'Аккаунт создан, но отправка писем пока не настроена на сервере.',
  });
}
