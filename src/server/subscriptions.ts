import type { PoolClient } from 'pg';
import { query, withTransaction } from './db';
import { buildProdamusPayformUrl, isProdamusConfigured } from './prodamus';
import {
  getSubscriptionPlan,
  getSubscriptionPlanDiscountRubles,
  getSubscriptionPlanTotalRubles,
  type SubscriptionPlanDefinition,
} from './subscriptionPlans';

export class SubscriptionCheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'SubscriptionCheckoutError';
    this.status = status;
  }
}

type UserCheckoutRow = {
  id: string;
  email: string;
  phone: string;
};

type CreatedOrderRow = {
  id: string;
  total_amount: number | string;
};

type CreatedPaymentRow = {
  id: string;
};

type ActiveSubscriptionRow = {
  id: string;
  current_period_end: string;
};

type AdminSubscriptionRow = {
  id: string;
  user_id: string;
  status: string;
  provider: string;
  plan_code: string;
  current_period_start: string;
  current_period_end: string;
  updated_at: string;
};

export interface SubscriptionCheckoutResult {
  orderId: string;
  paymentId: string;
  paymentUrl: string;
  totalRubles: number;
  planId: SubscriptionPlanDefinition['id'];
}

export type EffectiveSubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused';

export interface AdminSubscriptionUpdateResult {
  id: string;
  status: EffectiveSubscriptionStatus;
  planCode: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  updatedAt: string;
}

function rublesToKopecks(value: number): number {
  return Math.round(value * 100);
}

function buildRedirectOrigin(requestOrigin: string): string {
  return requestOrigin.replace(/\/+$/, '');
}

export function getEffectiveSubscriptionStatus(
  status: string,
  currentPeriodEnd: string | Date | null
): EffectiveSubscriptionStatus {
  if (status === 'active' && currentPeriodEnd) {
    const end = currentPeriodEnd instanceof Date ? currentPeriodEnd : new Date(currentPeriodEnd);
    if (end <= new Date()) {
      return 'expired';
    }
  }

  if (status === 'cancelled' || status === 'paused' || status === 'expired') {
    return status;
  }

  return 'active';
}

async function getUserCheckoutInfo(userId: string): Promise<UserCheckoutRow> {
  const result = await query<UserCheckoutRow>(
    `
      SELECT
        u.id,
        u.email,
        COALESCE(p.phone, '') AS phone
      FROM users u
      LEFT JOIN user_profiles p ON p.id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new SubscriptionCheckoutError('Пользователь не найден. Войдите в аккаунт ещё раз.', 401);
  }

  return row;
}

function buildSubscriptionPaymentUrl(params: {
  orderId: string;
  paymentId: string;
  plan: SubscriptionPlanDefinition;
  customerEmail: string;
  customerPhone: string;
  requestOrigin: string;
}): string {
  const origin = buildRedirectOrigin(params.requestOrigin);
  const totalRubles = getSubscriptionPlanTotalRubles(params.plan);

  return buildProdamusPayformUrl({
    order_id: params.orderId,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone || undefined,
    customer_extra: 'Оформление подписки на платформу',
    payment_comment: `Подписка ${params.plan.label}`,
    products: [
      {
        name: `Подписка ${params.plan.label}`,
        price: totalRubles,
        quantity: 1,
        sku: `subscription:${params.plan.id}`,
      },
    ],
    urlReturn: `${origin}/podpiska?payment=cancelled&order=${params.orderId}`,
    urlSuccess: `${origin}/podpiska?payment=success&order=${params.orderId}`,
    urlNotification: `${origin}/api/prodamus/webhook`,
    callbackType: 'json',
    do: 'pay',
    sys: process.env.PRODAMUS_SYS?.trim() ?? '',
  });
}

async function createSubscriptionRows(
  client: PoolClient,
  userId: string,
  plan: SubscriptionPlanDefinition
): Promise<{ order: CreatedOrderRow; payment: CreatedPaymentRow }> {
  const totalRubles = getSubscriptionPlanTotalRubles(plan);
  const discountRubles = getSubscriptionPlanDiscountRubles(plan);

  const orderResult = await client.query<CreatedOrderRow>(
    `
      INSERT INTO orders (
        user_id,
        status,
        total_amount,
        discount_amount,
        referral_discount,
        coupon_code,
        created_at
      )
      VALUES ($1, 'pending', $2, $3, 0, null, now())
      RETURNING id, total_amount
    `,
    [userId, rublesToKopecks(totalRubles), rublesToKopecks(discountRubles)]
  );

  const order = orderResult.rows[0];
  if (!order) {
    throw new SubscriptionCheckoutError('Не удалось создать заказ на подписку. Попробуйте ещё раз.', 500);
  }

  const paymentResult = await client.query<CreatedPaymentRow>(
    `
      INSERT INTO payments (
        order_id,
        user_id,
        provider,
        status,
        amount,
        raw_payload,
        created_at
      )
      VALUES ($1, $2, 'prodamus', 'pending', $3, $4::jsonb, now())
      RETURNING id
    `,
    [
      order.id,
      userId,
      rublesToKopecks(totalRubles),
      JSON.stringify({
        kind: 'subscription',
        planCode: plan.id,
        months: plan.months,
        discountPercent: plan.discountPercent,
        totalRubles,
      }),
    ]
  );

  const payment = paymentResult.rows[0];
  if (!payment) {
    throw new SubscriptionCheckoutError('Не удалось создать платёж на подписку. Попробуйте ещё раз.', 500);
  }

  return { order, payment };
}

export async function createSubscriptionCheckout(params: {
  userId: string;
  planId: string;
  requestOrigin: string;
}): Promise<SubscriptionCheckoutResult> {
  if (!isProdamusConfigured()) {
    throw new SubscriptionCheckoutError(
      'Оплата подписки ещё не настроена на сервере. Добавьте Prodamus secrets и опубликуйте сайт.',
      503
    );
  }

  const plan = getSubscriptionPlan(params.planId);
  if (!plan) {
    throw new SubscriptionCheckoutError('Тариф подписки не найден.', 400);
  }

  const user = await getUserCheckoutInfo(params.userId);
  const { order, payment } = await withTransaction((client) =>
    createSubscriptionRows(client, params.userId, plan)
  );

  const paymentUrl = buildSubscriptionPaymentUrl({
    orderId: order.id,
    paymentId: payment.id,
    plan,
    customerEmail: user.email,
    customerPhone: user.phone,
    requestOrigin: params.requestOrigin,
  });

  await query(
    `
      UPDATE payments
      SET raw_payload = COALESCE(raw_payload, '{}'::jsonb)
        || jsonb_build_object('payformUrl', $2::text)
      WHERE id = $1
    `,
    [payment.id, paymentUrl]
  );

  return {
    orderId: order.id,
    paymentId: payment.id,
    paymentUrl,
    totalRubles: getSubscriptionPlanTotalRubles(plan),
    planId: plan.id,
  };
}

export async function activateSubscriptionFromPayment(params: {
  client: PoolClient;
  userId: string;
  planId: string;
  months: number;
  rawPayload: Record<string, unknown>;
}): Promise<void> {
  const activeResult = await params.client.query<ActiveSubscriptionRow>(
    `
      SELECT id, current_period_end
      FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND current_period_end > now()
      ORDER BY current_period_end DESC
      LIMIT 1
    `,
    [params.userId]
  );

  const active = activeResult.rows[0];
  if (active) {
    await params.client.query(
      `
        UPDATE subscriptions
        SET current_period_end = current_period_end + make_interval(months => $2),
            plan_code = $3,
            provider = 'prodamus',
            updated_at = now(),
            raw_payload = COALESCE(raw_payload, '{}'::jsonb) || $4::jsonb
        WHERE id = $1
      `,
      [active.id, params.months, params.planId, JSON.stringify(params.rawPayload)]
    );
    return;
  }

  await params.client.query(
    `
      INSERT INTO subscriptions (
        user_id,
        provider,
        provider_subscription_id,
        plan_code,
        status,
        current_period_start,
        current_period_end,
        discount_percent,
        raw_payload,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        'prodamus',
        null,
        $2,
        'active',
        now(),
        now() + make_interval(months => $3),
        0,
        $4::jsonb,
        now(),
        now()
      )
    `,
    [params.userId, params.planId, params.months, JSON.stringify(params.rawPayload)]
  );
}

export async function updateSubscriptionByAdmin(params: {
  subscriptionId: string;
  action: 'pause' | 'resume' | 'cancel' | 'expire' | 'extend';
  months?: number;
}): Promise<AdminSubscriptionUpdateResult> {
  return withTransaction(async (client) => {
    const existingResult = await client.query<AdminSubscriptionRow>(
      `
        SELECT id, user_id, status, provider, plan_code, current_period_start, current_period_end, updated_at
        FROM subscriptions
        WHERE id = $1
        LIMIT 1
      `,
      [params.subscriptionId]
    );

    const existing = existingResult.rows[0];
    if (!existing) {
      throw new SubscriptionCheckoutError('Подписка не найдена.', 404);
    }

    if (params.action === 'pause') {
      await client.query(
        `
          UPDATE subscriptions
          SET status = 'paused',
              updated_at = now()
          WHERE id = $1
        `,
        [params.subscriptionId]
      );
    } else if (params.action === 'resume') {
      const effectiveStatus = getEffectiveSubscriptionStatus(existing.status, existing.current_period_end);
      if (effectiveStatus === 'expired') {
        throw new SubscriptionCheckoutError(
          'Истекшую подписку нельзя просто возобновить. Продлите её на новый период.',
          409
        );
      }

      await client.query(
        `
          UPDATE subscriptions
          SET status = 'active',
              updated_at = now()
          WHERE id = $1
        `,
        [params.subscriptionId]
      );
    } else if (params.action === 'cancel') {
      await client.query(
        `
          UPDATE subscriptions
          SET status = 'cancelled',
              updated_at = now()
          WHERE id = $1
        `,
        [params.subscriptionId]
      );
    } else if (params.action === 'expire') {
      await client.query(
        `
          UPDATE subscriptions
          SET status = 'expired',
              current_period_end = now(),
              updated_at = now()
          WHERE id = $1
        `,
        [params.subscriptionId]
      );
    } else if (params.action === 'extend') {
      const months = Number.isFinite(params.months) ? Math.max(1, Math.round(params.months ?? 1)) : 1;
      await client.query(
        `
          UPDATE subscriptions
          SET status = 'active',
              current_period_end = GREATEST(current_period_end, now()) + make_interval(months => $2),
              updated_at = now()
          WHERE id = $1
        `,
        [params.subscriptionId, months]
      );
    }

    const updatedResult = await client.query<AdminSubscriptionRow>(
      `
        SELECT id, user_id, status, provider, plan_code, current_period_start, current_period_end, updated_at
        FROM subscriptions
        WHERE id = $1
        LIMIT 1
      `,
      [params.subscriptionId]
    );

    const updated = updatedResult.rows[0];
    if (!updated) {
      throw new SubscriptionCheckoutError('Не удалось обновить подписку.', 500);
    }

    return {
      id: updated.id,
      status: getEffectiveSubscriptionStatus(updated.status, updated.current_period_end),
      planCode: updated.plan_code,
      currentPeriodStart: new Date(updated.current_period_start).toISOString(),
      currentPeriodEnd: new Date(updated.current_period_end).toISOString(),
      updatedAt: new Date(updated.updated_at).toISOString(),
    };
  });
}
