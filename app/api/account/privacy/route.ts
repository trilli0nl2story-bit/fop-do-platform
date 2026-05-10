import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { withTransaction } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';
import { ensureConsentsTable, recordConsent } from '@/src/server/consents';
import {
  ensureAccountPrivacyTables,
  getAccountPrivacySettings,
  listAccountPrivacyRequests,
  saveMarketingPreference,
} from '@/src/server/accountPrivacy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [settings, recentRequests] = await Promise.all([
      getAccountPrivacySettings(user.id),
      listAccountPrivacyRequests(user.id),
    ]);

    return NextResponse.json({
      ok: true,
      settings,
      recentRequests,
    });
  } catch (error) {
    console.error('[api/account/privacy][GET]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await consumeRequestRateLimit(request, {
      scope: 'account-privacy-update',
      limit: 20,
      windowSeconds: 60,
      keyParts: [user.id],
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json().catch(() => ({}));
    const marketingOptIn = body.marketingOptIn === true;

    await ensureAccountPrivacyTables();
    await ensureConsentsTable();

    await withTransaction(async (client) => {
      await saveMarketingPreference(
        {
          userId: user.id,
          marketingOptIn,
          source: 'profile',
        },
        request,
        client
      );

      if (marketingOptIn) {
        await recordConsent(
          {
            userId: user.id,
            email: user.email,
            formName: 'profile_privacy',
            consentType: 'marketing',
            documentSlug: 'marketing-consent',
            metadata: { source: 'profile_privacy_settings' },
          },
          request,
          client
        );
      }
    });

    const settings = await getAccountPrivacySettings(user.id);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error('[api/account/privacy][PATCH]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
