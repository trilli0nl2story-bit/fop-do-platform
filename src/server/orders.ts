import type { PoolClient } from 'pg';
import { query, withTransaction } from './db';
import {
  quoteCart,
  type CartQuote,
  type CartQuoteItem,
  type CartQuoteInputItem,
} from './cartQuote';
import { getAppOrigin } from './appOrigin';
import { claimReferralForOrder } from './referrals';
import { buildProdamusPayformUrl, isProdamusConfigured } from './prodamus';
import { hasStoreCheckoutConsents, hasSubscriptionCheckoutConsents } from './consents';

export class CheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'CheckoutError';
    this.status = status;
  }
}

type UserCheckoutRow = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  patronymic: string;
  phone: string;
};

type ExistingAccessRow = {
  title: string;
};

type CreatedOrderRow = {
  id: string;
  total_amount: number | string;
  discount_amount: number | string;
  referral_discount: number | string;
  coupon_code: string | null;
};

type CreatedPaymentRow = {
  id: string;
};

type OrderStatusRow = {
  id: string;
  user_id: string;
  status: string;
  total_amount: number | string;
  discount_amount: number | string;
  referral_discount: number | string;
  coupon_code: string | null;
  created_at: string;
  paid_at: string | null;
};

type PaymentStatusRow = {
  status: string;
  provider: string;
  provider_payment_id: string | null;
  amount: number | string;
  paid_at: string | null;
  raw_payload: { kind?: string; payformUrl?: string } | null;
};

type PendingOrderCandidateRow = {
  order_id: string;
  order_total_amount: number | string;
  order_discount_amount: number | string;
  order_referral_discount: number | string;
  order_coupon_code: string | null;
  payment_id: string;
  payment_amount: number | string;
  payment_raw_payload: { payformUrl?: string; quote?: { totalRubles?: number } } | null;
  material_ids: string[] | null;
};

export interface CreateOrderResult {
  orderId: string;
  paymentId: string;
  paymentUrl: string;
  totalRubles: number;
}

type BeforePaymentReadyParams = {
  orderId: string;
  paymentId: string;
  totalRubles: number;
};

export interface UserOrderStatus {
  order: {
    id: string;
    status: string;
    totalRubles: number;
    discountRubles: number;
    referralDiscountPercent: number;
    couponCode: string | null;
    createdAt: string;
    paidAt: string | null;
  };
  payment: {
    status: string;
    provider: string;
    providerPaymentId: string | null;
    amountRubles: number;
    paidAt: string | null;
    resumePaymentUrl: string | null;
  } | null;
  items: Array<{
    materialId: string;
    slug: string;
    title: string;
    priceRubles: number;
  }>;
}

function rublesToKopecks(value: number): number {
  return Math.round(value * 100);
}

function kopecksToRubles(value: number): number {
  return Math.round(value / 100);
}

function buildPaymentComment(items: CartQuoteItem[]): string {
  const titles = items.map((item) => item.title);
  if (titles.length <= 2) return titles.join(', ');
  return `${titles.slice(0, 2).join(', ')} и ещё ${titles.length - 2}`;
}

async function getUserCheckoutInfo(userId: string): Promise<UserCheckoutRow> {
  const result = await query<UserCheckoutRow>(
    `
      SELECT
        u.id,
        u.email,
        COALESCE(p.name, '') AS name,
        COALESCE(p.last_name, '') AS last_name,
        COALESCE(p.patronymic, '') AS patronymic,
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
    throw new CheckoutError('Пользователь не найден. Войдите в аккаунт ещё раз.', 401);
  }

  return row;
}

async function ensureNoPurchasedMaterials(
  userId: string,
  materialIds: string[]
): Promise<void> {
  if (materialIds.length === 0) {
    throw new CheckoutError('Корзина пуста. Добавьте материалы и попробуйте снова.');
  }

  const result = await query<ExistingAccessRow>(
    `
      SELECT m.title
      FROM user_materials um
      JOIN materials m ON m.id = um.material_id
      WHERE um.user_id = $1
        AND um.material_id = ANY($2::uuid[])
        AND (um.expires_at IS NULL OR um.expires_at > now())
    `,
    [userId, materialIds]
  );

  if (result.rows.length > 0) {
    const titles = result.rows.map((row) => row.title).slice(0, 2).join(', ');
    throw new CheckoutError(
      `Часть материалов уже есть в вашем кабинете: ${titles}. Удалите их из корзины и попробуйте снова.`,
      409
    );
  }
}

function normalizeMaterialIds(materialIds: string[]): string {
  return [...materialIds].sort().join('|');
}

async function lockCheckoutScope(client: PoolClient, scope: string): Promise<void> {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [scope]);
}

async function findReusablePendingOrder(params: {
  client: PoolClient;
  userId: string;
  materialIds: string[];
  quote: CartQuote;
}): Promise<{ orderId: string; paymentId: string; paymentUrl: string | null; totalRubles: number } | null> {
  const normalizedMaterialIds = normalizeMaterialIds(params.materialIds);
  const referralCode = params.quote.referral.applied ? params.quote.referral.code : null;

  const result = await params.client.query<PendingOrderCandidateRow>(
    `
      SELECT
        o.id AS order_id,
        o.total_amount AS order_total_amount,
        o.discount_amount AS order_discount_amount,
        o.referral_discount AS order_referral_discount,
        o.coupon_code AS order_coupon_code,
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.raw_payload AS payment_raw_payload,
        array_agg(oi.material_id::text ORDER BY oi.material_id::text) AS material_ids
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
        AND o.status = 'pending'
        AND p.status = 'pending'
        AND p.provider = 'prodamus'
      GROUP BY
        o.id,
        o.total_amount,
        o.discount_amount,
        o.referral_discount,
        o.coupon_code,
        p.id,
        p.amount,
        p.raw_payload,
        o.created_at,
        p.created_at
      ORDER BY GREATEST(o.created_at, p.created_at) DESC
      LIMIT 10
    `,
    [params.userId]
  );

  for (const row of result.rows) {
    const rowMaterialIds = normalizeMaterialIds(row.material_ids ?? []);
    const sameItems = rowMaterialIds === normalizedMaterialIds;
    const sameTotal = Number(row.payment_amount ?? 0) === rublesToKopecks(params.quote.totalRubles);
    const sameReferral = (row.order_coupon_code ?? null) === (referralCode ?? null);

    if (!sameItems || !sameTotal || !sameReferral) {
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
      totalRubles: kopecksToRubles(Number(row.order_total_amount ?? 0)),
    };
  }

  return null;
}

async function insertOrderItems(
  client: PoolClient,
  orderId: string,
  items: CartQuoteItem[]
): Promise<void> {
  for (const item of items) {
    if (!item.materialId) {
      throw new CheckoutError('Не удалось определить материал для заказа. Обновите корзину и попробуйте ещё раз.', 400);
    }

    await client.query(
      `
        INSERT INTO order_items (order_id, material_id, price)
        VALUES ($1, $2, $3)
      `,
      [orderId, item.materialId, rublesToKopecks(item.finalPriceRubles)]
    );
  }
}

async function createOrderRows(
  client: PoolClient,
  userId: string,
  quote: CartQuote,
  items: CartQuoteItem[]
): Promise<{ order: CreatedOrderRow; payment: CreatedPaymentRow }> {
  const referralDiscount = quote.discounts.find((discount) => discount.code === 'referral');
  const referralCode = quote.referral.applied ? quote.referral.code : null;

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
      VALUES ($1, 'pending', $2, $3, $4, $5, now())
      RETURNING id, total_amount, discount_amount, referral_discount, coupon_code
    `,
    [
      userId,
      rublesToKopecks(quote.totalRubles),
      rublesToKopecks(quote.totalDiscountRubles),
      referralDiscount?.appliedPercent ?? 0,
      referralCode,
    ]
  );

  const order = orderResult.rows[0];
  if (!order) {
    throw new CheckoutError('Не удалось создать заказ. Попробуйте ещё раз.', 500);
  }

  await insertOrderItems(client, order.id, items);

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
      rublesToKopecks(quote.totalRubles),
      JSON.stringify({
        source: 'cart_quote',
        quote,
      }),
    ]
  );

  const payment = paymentResult.rows[0];
  if (!payment) {
    throw new CheckoutError('Не удалось создать платёж. Попробуйте ещё раз.', 500);
  }

  return { order, payment };
}

function buildPaymentUrl(params: {
  orderId: string;
  quote: CartQuote;
  items: CartQuoteItem[];
  customerEmail: string;
  customerPhone: string;
  requestOrigin: string;
}): string {
  const origin = getAppOrigin(params.requestOrigin);

  return buildProdamusPayformUrl({
    order_id: params.orderId,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone || undefined,
    customer_extra: 'Покупка материалов в Методическом кабинете педагога',
    payment_comment: buildPaymentComment(params.items),
    products: params.items.map((item) => ({
      name: item.title,
      price: item.finalPriceRubles,
      quantity: 1,
      sku: item.slug,
    })),
    urlReturn: `${origin}/korzina?payment=cancelled&order=${params.orderId}`,
    urlSuccess: `${origin}/korzina?payment=success&order=${params.orderId}`,
    urlNotification: `${origin}/api/prodamus/webhook`,
    callbackType: 'json',
    do: 'pay',
    sys: process.env.PRODAMUS_SYS?.trim() ?? '',
  });
}

export async function createStoreOrderCheckout(params: {
  userId: string;
  items: CartQuoteInputItem[];
  referralCode?: string | null;
  requestOrigin: string;
  beforePaymentReady: (payment: BeforePaymentReadyParams) => Promise<void>;
}): Promise<CreateOrderResult> {
  if (!isProdamusConfigured()) {
    throw new CheckoutError(
      'Оплата ещё не настроена на сервере. Добавьте Prodamus secrets и опубликуйте сайт.',
      503
    );
  }

  const [user, quote] = await Promise.all([
    getUserCheckoutInfo(params.userId),
    quoteCart({
      items: params.items,
      userId: params.userId,
      referralCode: params.referralCode ?? null,
    }),
  ]);

  const availableItems = quote.items.filter((item) => item.available);
  if (availableItems.length === 0) {
    throw new CheckoutError('В корзине нет доступных материалов для покупки.', 400);
  }

  if (!quote.checkoutReady) {
    throw new CheckoutError('Корзина изменилась. Проверьте материалы и попробуйте ещё раз.', 409);
  }

  await ensureNoPurchasedMaterials(
    params.userId,
    availableItems
      .map((item) => item.materialId)
      .filter((value): value is string => Boolean(value))
  );

  const materialIds = availableItems
    .map((item) => item.materialId)
    .filter((value): value is string => Boolean(value));

  const { order, payment, reused } = await withTransaction(async (client) => {
    await lockCheckoutScope(client, `store-checkout:${params.userId}`);

    const reusable = await findReusablePendingOrder({
      client,
      userId: params.userId,
      materialIds,
      quote,
    });

    if (reusable) {
      return {
        order: { id: reusable.orderId, total_amount: rublesToKopecks(reusable.totalRubles) } as CreatedOrderRow,
        payment: { id: reusable.paymentId } as CreatedPaymentRow,
        reused: reusable,
      };
    }

    const created = await createOrderRows(client, params.userId, quote, availableItems);

    if (quote.referral.applied && quote.referral.code) {
      await claimReferralForOrder({
        referredUserId: params.userId,
        referralCode: quote.referral.code,
        client,
      });
    }

    return { ...created, reused: null };
  });

  const totalRubles = kopecksToRubles(Number(order.total_amount ?? 0));

  await params.beforePaymentReady({
    orderId: order.id,
    paymentId: payment.id,
    totalRubles,
  });

  let paymentUrl = reused?.paymentUrl ?? null;
  if (!paymentUrl) {
    paymentUrl = buildPaymentUrl({
      orderId: order.id,
      quote,
      items: availableItems,
      customerEmail: user.email,
      customerPhone: user.phone,
      requestOrigin: params.requestOrigin,
    });

    await query(
      `
        UPDATE payments
        SET raw_payload = jsonb_set(
              COALESCE(raw_payload, '{}'::jsonb),
              '{payformUrl}',
              to_jsonb($2::text),
              true
            )
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
  };
}

export async function getUserOrderStatus(
  userId: string,
  orderId: string
): Promise<UserOrderStatus | null> {
  const orderResult = await query<OrderStatusRow>(
    `
      SELECT id, user_id, status, total_amount, discount_amount, referral_discount, coupon_code, created_at, paid_at
      FROM orders
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [orderId, userId]
  );

  const order = orderResult.rows[0];
  if (!order) return null;

  const [paymentResult, itemsResult] = await Promise.all([
    query<PaymentStatusRow>(
      `
        SELECT status, provider, provider_payment_id, amount, paid_at, raw_payload
        FROM payments
        WHERE order_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [orderId]
    ),
    query<{
      material_id: string;
      slug: string;
      title: string;
      price: number | string;
    }>(
      `
        SELECT oi.material_id, m.slug, m.title, oi.price
        FROM order_items oi
        JOIN materials m ON m.id = oi.material_id
        WHERE oi.order_id = $1
        ORDER BY m.title ASC
      `,
      [orderId]
    ),
  ]);

  const payment = paymentResult.rows[0];
  const paymentKind =
    typeof payment?.raw_payload?.kind === 'string'
      ? payment.raw_payload.kind
      : 'store_order';
  const hasCheckoutConsents =
    payment?.status === 'pending' && order.status === 'pending' && paymentKind === 'store_order'
      ? await hasStoreCheckoutConsents({ userId, orderId })
      : payment?.status === 'pending' && order.status === 'pending' && paymentKind === 'subscription'
        ? await hasSubscriptionCheckoutConsents({ userId, orderId })
      : true;

  const resumePaymentUrl =
    payment?.status === 'pending' &&
    order.status === 'pending' &&
    hasCheckoutConsents &&
    payment.provider === 'prodamus' &&
    typeof payment.raw_payload?.payformUrl === 'string' &&
    payment.raw_payload.payformUrl.trim()
      ? payment.raw_payload.payformUrl.trim()
      : null;

  return {
    order: {
      id: order.id,
      status: order.status,
      totalRubles: kopecksToRubles(Number(order.total_amount ?? 0)),
      discountRubles: kopecksToRubles(Number(order.discount_amount ?? 0)),
      referralDiscountPercent: Number(order.referral_discount ?? 0),
      couponCode: order.coupon_code,
      createdAt: new Date(order.created_at).toISOString(),
      paidAt: order.paid_at ? new Date(order.paid_at).toISOString() : null,
    },
    payment: payment
        ? {
          status: payment.status,
          provider: payment.provider,
          providerPaymentId: payment.provider_payment_id,
          amountRubles: kopecksToRubles(Number(payment.amount ?? 0)),
          paidAt: payment.paid_at ? new Date(payment.paid_at).toISOString() : null,
          resumePaymentUrl,
        }
      : null,
    items: itemsResult.rows.map((item) => ({
      materialId: item.material_id,
      slug: item.slug,
      title: item.title,
      priceRubles: kopecksToRubles(Number(item.price ?? 0)),
    })),
  };
}
