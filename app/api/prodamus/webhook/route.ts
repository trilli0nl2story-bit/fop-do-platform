import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/src/server/db';
import { hasStoreCheckoutConsents } from '@/src/server/consents';
import { getProdamusConfig, verifyProdamusSignature } from '@/src/server/prodamus';
import { markReferralClaimPaid } from '@/src/server/referrals';
import { activateSubscriptionFromPayment } from '@/src/server/subscriptions';
import {
  sendStoreOrderPaidEmail,
  sendSubscriptionActivatedEmail,
} from '@/src/server/transactionalEmails';

export const dynamic = 'force-dynamic';

type WebhookOrderRow = {
  id: string;
  user_id: string;
  status: string;
  total_amount: number | string;
  coupon_code: string | null;
  referral_discount: number | string;
};

type WebhookPaymentRow = {
  id: string;
  status: string;
  amount: number | string;
  provider_payment_id: string | null;
  raw_payload: Record<string, unknown> | null;
};

type ProdamusWebhookPayload = Record<string, unknown> & {
  order_id?: string;
  payment_status?: string;
  sum?: string | number;
  amount?: string | number;
  order_num?: string;
  payment_id?: string | number;
  transaction?: string | number;
};

function parseMoneyKopecks(value: unknown): number {
  const normalized = String(value ?? '').replace(',', '.').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

function extractProviderPaymentId(payload: ProdamusWebhookPayload): string | null {
  const value = payload.payment_id ?? payload.transaction ?? payload.order_num;
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function isPaymentSuccessful(payload: ProdamusWebhookPayload): boolean {
  const status = String(payload.payment_status ?? '').trim().toLowerCase();
  return ['success', 'paid', 'succeeded'].includes(status);
}

async function parsePayload(request: Request): Promise<{
  payload: ProdamusWebhookPayload;
  signature: string | null;
}> {
  const signature =
    request.headers.get('sign') ??
    request.headers.get('signature') ??
    request.headers.get('x-signature');

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await request.json() as ProdamusWebhookPayload;
    return { payload, signature };
  }

  const form = await request.formData();
  const payload = Object.fromEntries(form.entries()) as ProdamusWebhookPayload;
  return { payload, signature };
}

export async function POST(request: Request) {
  try {
    const { secretKey } = getProdamusConfig();
    const { payload, signature } = await parsePayload(request);

    if (!signature || !verifyProdamusSignature(payload, secretKey, signature)) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 403 });
    }

    const orderId = typeof payload.order_id === 'string' ? payload.order_id.trim() : '';
    if (!orderId) {
      return NextResponse.json({ error: 'missing_order_id' }, { status: 400 });
    }

    const orderResult = await query<WebhookOrderRow>(
      `
        SELECT id, user_id, status, total_amount, coupon_code, referral_discount
        FROM orders
        WHERE id = $1
        LIMIT 1
      `,
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) {
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }

    const paymentResult = await query<WebhookPaymentRow>(
      `
        SELECT id, status, amount, provider_payment_id, raw_payload
        FROM payments
        WHERE order_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [orderId]
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
    }

    const amountKopecks = parseMoneyKopecks(payload.sum ?? payload.amount);
    if (amountKopecks > 0 && Number(payment.amount ?? 0) !== amountKopecks) {
      return NextResponse.json({ error: 'amount_mismatch' }, { status: 409 });
    }

    const providerPaymentId = extractProviderPaymentId(payload);
    const successful = isPaymentSuccessful(payload);
    const paymentKind =
      typeof payment.raw_payload?.kind === 'string'
        ? payment.raw_payload.kind
        : 'store_order';

    if (successful && paymentKind !== 'subscription') {
      const hasCheckoutConsents = await hasStoreCheckoutConsents({
        userId: order.user_id,
        orderId,
      });

      if (!hasCheckoutConsents) {
        return NextResponse.json(
          { error: 'missing_checkout_consent', message: 'Store checkout consents are missing for this order.' },
          { status: 409 }
        );
      }
    }

    let storeOrderEmailOrderId: string | null = null;
    let subscriptionEmail:
      | {
          userId: string;
          planId: string;
          currentPeriodEnd: string;
          wasExtended: boolean;
        }
      | null = null;

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE payments
          SET provider_payment_id = COALESCE($2, provider_payment_id),
              status = CASE WHEN $3 THEN 'succeeded' ELSE 'failed' END,
              paid_at = CASE WHEN $3 THEN COALESCE(paid_at, now()) ELSE paid_at END,
              raw_payload = COALESCE(raw_payload, '{}'::jsonb) || $4::jsonb
          WHERE id = $1
        `,
        [payment.id, providerPaymentId, successful, JSON.stringify({ webhook: payload })]
      );

      if (!successful) {
        await client.query(
          `
            UPDATE orders
            SET status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END
            WHERE id = $1
          `,
          [orderId]
        );
        return;
      }

      if (order.status === 'paid' || payment.status === 'succeeded') {
        return;
      }

      await client.query(
        `
          UPDATE orders
          SET status = 'paid',
              paid_at = COALESCE(paid_at, now())
          WHERE id = $1
        `,
        [orderId]
      );

      if (paymentKind === 'subscription') {
        const planId =
          typeof payment.raw_payload?.planCode === 'string'
            ? payment.raw_payload.planCode
            : 'monthly';
        const months =
          typeof payment.raw_payload?.months === 'number'
            ? payment.raw_payload.months
            : Number(payment.raw_payload?.months ?? 1);

        const activation = await activateSubscriptionFromPayment({
          client,
          userId: order.user_id,
          planId,
          months: Number.isFinite(months) && months > 0 ? months : 1,
          rawPayload: {
            source: 'prodamus-webhook',
            paymentId: payment.id,
            providerPaymentId,
            webhook: payload,
          },
        });

        subscriptionEmail = {
          userId: order.user_id,
          planId,
          currentPeriodEnd: activation.currentPeriodEnd,
          wasExtended: activation.wasExtended,
        };
      } else {
        await client.query(
          `
            INSERT INTO user_materials (user_id, material_id, access_type, order_id, granted_at)
            SELECT o.user_id, oi.material_id, 'purchase', o.id, now()
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE o.id = $1
            ON CONFLICT (user_id, material_id) DO NOTHING
          `,
          [orderId]
        );

        storeOrderEmailOrderId = orderId;
      }

      if (order.coupon_code && Number(order.referral_discount ?? 0) > 0) {
        await markReferralClaimPaid({
          orderId,
          referredUserId: order.user_id,
          referralCode: order.coupon_code,
          client,
        });

        await client.query(
          `
            UPDATE referrals
            SET referred_id = COALESCE(referred_id, $2),
                status = 'paid',
                paid_order_id = $1,
                updated_at = now()
            WHERE lower(referral_code) = lower($3)
              AND (referred_id IS NULL OR referred_id = $2)
          `,
          [orderId, order.user_id, order.coupon_code]
        );
      }
    });

    if (storeOrderEmailOrderId) {
      await sendStoreOrderPaidEmail(storeOrderEmailOrderId).catch((error) => {
        console.error(
          '[api/prodamus/webhook] store order email failed',
          error instanceof Error ? error.message : String(error)
        );
      });
    }

    if (subscriptionEmail) {
      await sendSubscriptionActivatedEmail(subscriptionEmail).catch((error) => {
        console.error(
          '[api/prodamus/webhook] subscription email failed',
          error instanceof Error ? error.message : String(error)
        );
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/prodamus/webhook]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
