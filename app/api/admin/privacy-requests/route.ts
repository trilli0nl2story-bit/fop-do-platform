import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import {
  listAdminAccountPrivacyRequests,
  type PrivacyRequestStatus,
  type PrivacyRequestType,
} from '@/src/server/accountPrivacy';

export const dynamic = 'force-dynamic';

const PRIVACY_REQUEST_STATUSES = new Set<PrivacyRequestStatus>([
  'new',
  'in_progress',
  'completed',
  'rejected',
]);

const PRIVACY_REQUEST_TYPES = new Set<PrivacyRequestType>([
  'data_export',
  'account_deletion',
  'consent_withdrawal',
]);

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { error: null };
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? '';
    const requestType = searchParams.get('type')?.trim() ?? '';

    if (status && !PRIVACY_REQUEST_STATUSES.has(status as PrivacyRequestStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (requestType && !PRIVACY_REQUEST_TYPES.has(requestType as PrivacyRequestType)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    return NextResponse.json(
      await listAdminAccountPrivacyRequests({
        search,
        status: status as PrivacyRequestStatus | '',
        requestType: requestType as PrivacyRequestType | '',
      })
    );
  } catch (error) {
    console.error('[api/admin/privacy-requests]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
