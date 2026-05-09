import type { PoolClient } from 'pg';
import { getAppOrigin } from './appOrigin';
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

type PendingSubscriptionRow = {
  order_id: string;
  order_total_amount: number | string;
  payment_id: string;
  payment_amount: number | string;
  payment_raw_payload: {
    kind?: string;
    planCode?: string;
    payformUrl?: string;
  } | null;
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

export interface ActivatedSubscriptionResult {
  currentPeriodEnd: string;
  wasExtended: boolean;
}

function rublesToKopecks(value: number): number {
  return Math.round(value * 100);
}

async function lockSubscriptionScope(client: PoolClient, scope: string): Promise<void> {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [scope]);
}

async function findReusablePendingSubscription(params: {
  client: PoolClient;
  userId: string;
  planId: string;
  totalRubles: number;
}): Promise<{ orderId: string; paymentId: string; paymentUrl: string | null; totalRubles: number } | null> {
  const result = await params.client.query<PendingSubscriptionRow>(
    `
      SELECT
        o.id AS order_id,
        o.total_amount AS order_total_amount,
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.raw_payload AS payment_raw_payload
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      WHERE o.user_id = $1
        AND o.status = 'pending'
        AND p.status = 'pending'
        AND p.provider = 'prodamus'
      ORDER BY GREATEST(o.created_at, p.created_at) DESC
      LIMIT 10
    `,
    [params.userId]
  );

  for (const row of result.rows) {
    const sameKind = row.payment_raw_payload?.kind === 'subscription';
    const samePlan = row.payment_raw_payload?.planCode === params.planId;
    const sameTotal = Number(row.payment_amount ?? 0) === rublesToKopecks(params.totalRubles);
    if (!sameKind || !samePlan || !sameTotal) {
      continue;
    }

    const paymentUrl =
      typeof row.payment_raw_payload?.payformUrl === 'string' && row.payment_raw_payload.payformUrl.trim()
        ? row.payment_raw_payload.payformUrl.trim()
        : null;

    return {
      orderId: row.order_id,
      paymentId: row.payment_id,
      paymentUrl,
      totalRubles: Math.round(Number(row.order_total_amount ?? 0) / 100),
    };
  }

  return null;
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
  const origin = getAppOrigin(params.requestOrigin);
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
  const totalRubles = getSubscriptionPlanTotalRubles(plan);
  const { order, payment, reused } = await withTransaction(async (client) => {
    await lockSubscriptionScope(client, `subscription-checkout:${params.userId}`);

    const reusable = await findReusablePendingSubscription({
      client,
      userId: params.userId,
      planId: plan.id,
      totalRubles,
    });

    if (reusable) {
      return {
        order: { id: reusable.orderId, total_amount: rublesToKopecks(reusable.totalRubles) } as CreatedOrderRow,
        payment: { id: reusable.paymentId } as CreatedPaymentRow,
        reused: reusable,
      };
    }

    const created = await createSubscriptionRows(client, params.userId, plan);
    return { ...created, reused: null };
  });

  let paymentUrl = reused?.paymentUrl ?? null;
  if (!paymentUrl) {
    paymentUrl = buildSubscriptionPaymentUrl({
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
  }

  return {
    orderId: order.id,
    paymentId: payment.id,
    paymentUrl,
    totalRubles,
    planId: plan.id,
  };
}

export async function activateSubscriptionFromPayment(params: {
  client: PoolClient;
  userId: string;
  planId: string;
  months: number;
  rawPayload: Record<string, unknown>;
}): Promise<ActivatedSubscriptionResult> {
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
    const updateResult = await params.client.query<{ current_period_end: string }>(
      `
        UPDATE subscriptions
        SET current_period_end = current_period_end + make_interval(months => $2),
            plan_code = $3,
            provider = 'prodamus',
            updated_at = now(),
            raw_payload = COALESCE(raw_payload, '{}'::jsonb) || $4::jsonb
        WHERE id = $1
        RETURNING current_period_end
      `,
      [active.id, params.months, params.planId, JSON.stringify(params.rawPayload)]
    );

    return {
      currentPeriodEnd: new Date(updateResult.rows[0].current_period_end).toISOString(),
      wasExtended: true,
    };
  }

  const insertResult = await params.client.query<{ current_period_end: string }>(
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
      RETURNING current_period_end
    `,
    [params.userId, params.planId, params.months, JSON.stringify(params.rawPayload)]
  );

  return {
    currentPeriodEnd: new Date(insertResult.rows[0].current_period_end).toISOString(),
    wasExtended: false,
  };
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
