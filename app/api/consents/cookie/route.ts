import { NextRequest, NextResponse } from 'next/server';
import { ensureConsentsTable, recordConsent } from '@/src/server/consents';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

function asBoolean(value: unknown): boolean {
  return value === true;
}

export async function POST(req: NextRequest) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;

  const rate = await consumeRequestRateLimit(req, {
    scope: 'cookie-consent',
    limit: 20,
    windowSeconds: 60 * 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(rate, 'Слишком много запросов. Попробуйте позже.');
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const analytics = asBoolean(body.analytics);
  const ads = asBoolean(body.ads);
  const metadata = {
    choiceVersion: typeof body.version === 'string' ? body.version.slice(0, 40) : null,
    acceptedAtClient: typeof body.acceptedAt === 'string' ? body.acceptedAt.slice(0, 80) : null,
    necessary: true,
    analytics,
    ads,
  };

  if (!analytics && !ads) {
    return NextResponse.json({ ok: true });
  }

  try {
    await ensureConsentsTable();

    if (analytics) {
      await recordConsent(
        {
          formName: 'cookie_banner',
          consentType: 'cookies_analytics',
          documentSlug: 'cookie-policy',
          metadata,
        },
        req
      );
    }

    if (ads) {
      await recordConsent(
        {
          formName: 'cookie_banner',
          consentType: 'cookies_ads',
          documentSlug: 'cookie-policy',
          metadata,
        },
        req
      );
    }
  } catch (error) {
    console.error('[api/consents/cookie]', error instanceof Error ? error.message : String(error));
  }

  return NextResponse.json({ ok: true });
}
