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

    const result = await query<{
      id: string;
      status: string;
      total_amount: number | string;
      discount_amount: number | string;
      referral_discount: number | string;
      coupon_code: string | null;
      created_at: string;
      paid_at: string | null;
      user_email: string;
      payment_status: string | null;
      provider: string | null;
    }>(
      `
        SELECT
          o.id,
          o.status,
          o.total_amount,
          o.discount_amount,
          o.referral_discount,
          o.coupon_code,
          o.created_at,
          o.paid_at,
          u.email AS user_email,
          p.status AS payment_status,
          p.provider
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN LATERAL (
          SELECT status, provider
          FROM payments
          WHERE order_id = o.id
          ORDER BY created_at DESC
          LIMIT 1
        ) p ON true
        WHERE ($1 = '' OR u.email ILIKE $2 OR o.id::text ILIKE $2)
          AND ($3 = '' OR o.status = $3)
        ORDER BY o.created_at DESC
        LIMIT 50
      `,
      [search, `%${search}%`, status]
    );

    return NextResponse.json({
      items: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        totalRubles: Math.round(Number(row.total_amount ?? 0) / 100),
        discountRubles: Math.round(Number(row.discount_amount ?? 0) / 100),
        referralDiscountPercent: Number(row.referral_discount ?? 0),
        couponCode: row.coupon_code,
        createdAt: new Date(row.created_at).toISOString(),
        paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
        userEmail: row.user_email,
        paymentStatus: row.payment_status ?? 'none',
        provider: row.provider ?? '',
      })),
    });
  } catch (err) {
    console.error('[api/admin/orders]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
