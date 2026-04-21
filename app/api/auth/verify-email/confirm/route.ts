import { NextResponse } from 'next/server';
import {
  createSessionToken,
  getCurrentUser,
  setSessionCookie,
} from '@/src/server/auth';
import { consumeEmailVerificationToken } from '@/src/server/emailVerification';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-verify-email-confirm',
    limit: 20,
    windowSeconds: 10 * 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(
      rate,
      'Слишком много попыток подтверждения. Подождите немного и попробуйте ещё раз.'
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { token?: string }
    | null;
  const token = body?.token?.trim();

  if (!token) {
    return NextResponse.json(
      { error: 'Ссылка подтверждения недействительна.' },
      { status: 400 }
    );
  }

  const result = await consumeEmailVerificationToken(token);
  if (!result.ok || !result.user) {
    return NextResponse.json(
      {
        error:
          result.reason === 'expired'
            ? 'Ссылка подтверждения устарела. Запросите новое письмо.'
            : 'Ссылка подтверждения недействительна.',
      },
      { status: 400 }
    );
  }

  const currentUser = await getCurrentUser();
  const redirectTo =
    currentUser?.id === result.user.id
      ? '/kabinet?emailVerification=success'
      : '/vhod?emailVerification=success';

  const response = NextResponse.json({ ok: true, redirectTo });

  if (currentUser?.id === result.user.id) {
    const tokenValue = await createSessionToken(result.user);
    setSessionCookie(response, tokenValue);
  }

  return response;
}
