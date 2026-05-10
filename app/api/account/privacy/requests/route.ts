import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';
import {
  createAccountPrivacyRequest,
  type PrivacyRequestType,
} from '@/src/server/accountPrivacy';

export const dynamic = 'force-dynamic';

const ALLOWED_REQUEST_TYPES = new Set<PrivacyRequestType>([
  'data_export',
  'account_deletion',
  'consent_withdrawal',
]);

export async function POST(request: NextRequest) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await consumeRequestRateLimit(request, {
      scope: 'account-privacy-request',
      limit: 5,
      windowSeconds: 60 * 60,
      keyParts: [user.id],
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json().catch(() => ({}));
    const requestType = body.requestType;

    if (typeof requestType !== 'string' || !ALLOWED_REQUEST_TYPES.has(requestType as PrivacyRequestType)) {
      return NextResponse.json(
        { error: 'invalid_request_type', message: 'Выберите корректный тип обращения.' },
        { status: 400 }
      );
    }

    const privacyRequest = await createAccountPrivacyRequest(
      {
        userId: user.id,
        requestType: requestType as PrivacyRequestType,
      },
      request
    );

    return NextResponse.json({
      ok: true,
      request: privacyRequest,
      message: 'Обращение сохранено. Мы обработаем его вручную и свяжемся с вами по email аккаунта.',
    });
  } catch (error) {
    console.error('[api/account/privacy/requests]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
