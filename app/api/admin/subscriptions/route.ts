import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

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
    const status = searchParams.get('status')?.trim() ?? '';

    const result = await query<{
      id: string;
      status: string;
      provider: string;
      plan_code: string;
      current_period_start: string;
      current_period_end: string;
      created_at: string;
      updated_at: string;
      user_email: string;
    }>(
      `
        SELECT
          s.id,
          s.status,
          s.provider,
          s.plan_code,
          s.current_period_start,
          s.current_period_end,
          s.created_at,
          s.updated_at,
          u.email AS user_email
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        WHERE ($1 = '' OR s.status = $1)
        ORDER BY s.updated_at DESC
        LIMIT 50
      `,
      [status]
    );

    return NextResponse.json({
      items: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        provider: row.provider,
        planCode: row.plan_code,
        currentPeriodStart: new Date(row.current_period_start).toISOString(),
        currentPeriodEnd: new Date(row.current_period_end).toISOString(),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        userEmail: row.user_email,
      })),
    });
  } catch (err) {
    console.error('[api/admin/subscriptions]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
