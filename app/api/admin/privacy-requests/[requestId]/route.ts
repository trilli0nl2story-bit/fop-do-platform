import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import {
  updateAdminAccountPrivacyRequest,
  type PrivacyRequestStatus,
} from '@/src/server/accountPrivacy';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

const PRIVACY_REQUEST_STATUSES = new Set<PrivacyRequestStatus>([
  'new',
  'in_progress',
  'completed',
  'rejected',
]);

interface Params {
  params: Promise<{ requestId: string }>;
}

function cleanAdminNote(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return '';
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, 5000);
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rate = await consumeRequestRateLimit(request, {
      scope: 'admin-privacy-requests-write',
      limit: 40,
      windowSeconds: 5 * 60,
      keyParts: [user.id],
    });
    if (!rate.allowed) return rateLimitResponse(rate);

    const { requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      status?: unknown;
      adminNote?: unknown;
    };

    const status = typeof body.status === 'string' ? body.status : '';
    const adminNote = cleanAdminNote(body.adminNote);

    if (!PRIVACY_REQUEST_STATUSES.has(status as PrivacyRequestStatus)) {
      return NextResponse.json({ error: 'Выберите корректный статус обращения.' }, { status: 400 });
    }

    if (adminNote === null) {
      return NextResponse.json({ error: 'Комментарий администратора передан неверно.' }, { status: 400 });
    }

    const item = await updateAdminAccountPrivacyRequest(
      {
        requestId,
        adminUserId: user.id,
        status: status as PrivacyRequestStatus,
        adminNote,
      },
      request
    );

    if (!item) {
      return NextResponse.json({ error: 'Обращение не найдено.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error('[api/admin/privacy-requests/:requestId]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
