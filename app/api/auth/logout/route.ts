import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/src/server/auth';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-logout',
    limit: 30,
    windowSeconds: 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(
      rate,
      'Слишком много запросов на выход. Подождите немного и попробуйте ещё раз.'
    );
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
