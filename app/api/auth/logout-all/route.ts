import { NextResponse } from 'next/server';
import {
  bumpUserSessionVersion,
  clearSessionCookie,
  getCurrentUser,
} from '@/src/server/auth';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-logout-all',
    limit: 5,
    windowSeconds: 10 * 60,
    keyParts: [currentUser.id],
  });
  if (!rate.allowed) {
    return rateLimitResponse(
      rate,
      'Слишком много попыток завершить сессии. Подождите немного и попробуйте ещё раз.'
    );
  }

  await bumpUserSessionVersion(currentUser.id);

  const response = NextResponse.json({
    ok: true,
    redirectTo: '/vhod?sessionReset=success',
  });
  clearSessionCookie(response);
  return response;
}
