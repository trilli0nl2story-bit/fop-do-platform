import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { getReleaseReadinessSummary } from '@/src/server/readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(await getReleaseReadinessSummary());
  } catch (error) {
    console.error('[api/admin/readiness]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
