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

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { orderId } = await context.params;

    const [orderResult, paymentResult, itemsResult] = await Promise.all([
      query<{
        id: string;
        status: string;
        total_amount: number | string;
        discount_amount: number | string;
        referral_discount: number | string;
        coupon_code: string | null;
        created_at: string;
        paid_at: string | null;
        user_email: string;
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
            u.email AS user_email
          FROM orders o
          JOIN users u ON u.id = o.user_id
          WHERE o.id = $1
          LIMIT 1
        `,
        [orderId]
      ),
      query<{
        id: string;
        status: string;
        provider: string;
        provider_payment_id: string | null;
        amount: number | string;
        created_at: string;
        paid_at: string | null;
        raw_payload: Record<string, unknown> | null;
      }>(
        `
          SELECT id, status, provider, provider_payment_id, amount, created_at, paid_at, raw_payload
          FROM payments
          WHERE order_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [orderId]
      ),
      query<{
        id: string;
        material_id: string;
        slug: string;
        title: string;
        price: number | string;
      }>(
        `
          SELECT oi.id, oi.material_id, m.slug, m.title, oi.price
          FROM order_items oi
          JOIN materials m ON m.id = oi.material_id
          WHERE oi.order_id = $1
          ORDER BY m.title ASC
        `,
        [orderId]
      ),
    ]);

    const order = orderResult.rows[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const payment = paymentResult.rows[0];

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        totalRubles: Math.round(Number(order.total_amount ?? 0) / 100),
        discountRubles: Math.round(Number(order.discount_amount ?? 0) / 100),
        referralDiscountPercent: Number(order.referral_discount ?? 0),
        couponCode: order.coupon_code,
        createdAt: new Date(order.created_at).toISOString(),
        paidAt: order.paid_at ? new Date(order.paid_at).toISOString() : null,
        userEmail: order.user_email,
      },
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            provider: payment.provider,
            providerPaymentId: payment.provider_payment_id,
            amountRubles: Math.round(Number(payment.amount ?? 0) / 100),
            createdAt: new Date(payment.created_at).toISOString(),
            paidAt: payment.paid_at ? new Date(payment.paid_at).toISOString() : null,
            kind:
              typeof payment.raw_payload?.kind === 'string'
                ? payment.raw_payload.kind
                : 'store_order',
          }
        : null,
      items: itemsResult.rows.map((row) => ({
        id: row.id,
        materialId: row.material_id,
        slug: row.slug,
        title: row.title,
        priceRubles: Math.round(Number(row.price ?? 0) / 100),
      })),
    });
  } catch (err) {
    console.error('[api/admin/orders/[orderId]]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
