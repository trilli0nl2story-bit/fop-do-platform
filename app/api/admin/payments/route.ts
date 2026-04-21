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
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? '';

    const [statsResult, itemsResult] = await Promise.all([
      query<{
        total_paid_kopecks: string | null;
        succeeded_count: string;
        pending_count: string;
        failed_count: string;
        refunded_count: string;
      }>(
        `
          SELECT
            COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) AS total_paid_kopecks,
            COUNT(*) FILTER (WHERE status = 'succeeded')::text AS succeeded_count,
            COUNT(*) FILTER (WHERE status = 'pending')::text AS pending_count,
            COUNT(*) FILTER (WHERE status = 'failed')::text AS failed_count,
            COUNT(*) FILTER (WHERE status = 'refunded')::text AS refunded_count
          FROM payments
        `
      ),
      query<{
        id: string;
        order_id: string;
        user_email: string;
        status: string;
        provider: string;
        provider_payment_id: string | null;
        amount: number | string;
        created_at: string;
        paid_at: string | null;
        order_status: string;
        payment_kind: string | null;
      }>(
        `
          SELECT
            p.id,
            p.order_id,
            u.email AS user_email,
            p.status,
            p.provider,
            p.provider_payment_id,
            p.amount,
            p.created_at,
            p.paid_at,
            o.status AS order_status,
            p.raw_payload ->> 'kind' AS payment_kind
          FROM payments p
          JOIN orders o ON o.id = p.order_id
          JOIN users u ON u.id = p.user_id
          WHERE ($1 = '' OR u.email ILIKE $2 OR p.order_id::text ILIKE $2 OR p.id::text ILIKE $2)
            AND ($3 = '' OR p.status = $3)
          ORDER BY p.created_at DESC
          LIMIT 100
        `,
        [search, `%${search}%`, status]
      ),
    ]);

    const stats = statsResult.rows[0];

    return NextResponse.json({
      summary: {
        paidTotalRubles: Math.round(Number(stats?.total_paid_kopecks ?? 0) / 100),
        succeededCount: Number(stats?.succeeded_count ?? '0'),
        pendingCount: Number(stats?.pending_count ?? '0'),
        failedCount: Number(stats?.failed_count ?? '0'),
        refundedCount: Number(stats?.refunded_count ?? '0'),
      },
      items: itemsResult.rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        userEmail: row.user_email,
        status: row.status,
        provider: row.provider,
        providerPaymentId: row.provider_payment_id,
        amountRubles: Math.round(Number(row.amount ?? 0) / 100),
        createdAt: new Date(row.created_at).toISOString(),
        paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
        orderStatus: row.order_status,
        kind: row.payment_kind ?? 'store_order',
      })),
    });
  } catch (err) {
    console.error('[api/admin/payments]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
