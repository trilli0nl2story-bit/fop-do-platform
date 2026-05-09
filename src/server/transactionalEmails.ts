import { getAppOrigin } from './appOrigin';
import { query } from './db';
import { sendEmail } from './email';
import { getSubscriptionPlan } from './subscriptionPlans';

function formatRubles(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function sendStoreOrderPaidEmail(orderId: string): Promise<void> {
  const orderResult = await query<{
    email: string;
    total_amount: number | string;
  }>(
    `
      SELECT u.email, o.total_amount
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.id = $1
      LIMIT 1
    `,
    [orderId]
  );

  const order = orderResult.rows[0];
  if (!order?.email) {
    return;
  }

  const itemsResult = await query<{ title: string; slug: string }>(
    `
      SELECT m.title, m.slug
      FROM order_items oi
      JOIN materials m ON m.id = oi.material_id
      WHERE oi.order_id = $1
      ORDER BY m.title ASC
    `,
    [orderId]
  );

  const origin = getAppOrigin();
  const cabinetUrl = `${origin}/kabinet`;
  const materialsUrl = `${origin}/moi-dokumenty`;
  const totalRubles = Math.round(Number(order.total_amount ?? 0) / 100);
  const itemLines = itemsResult.rows.map((item) => `• ${item.title}`);
  const itemHtml = itemsResult.rows
    .map((item) => `<li style="margin:0 0 6px">${item.title}</li>`)
    .join('');

  await sendEmail({
    to: order.email,
    subject: 'Оплата получена. Материалы уже доступны в кабинете',
    text: [
      'Здравствуйте!',
      '',
      'Мы получили оплату по вашему заказу. Материалы уже доступны в личном кабинете.',
      '',
      'Что оплачено:',
      ...itemLines,
      '',
      `Сумма заказа: ${formatRubles(totalRubles)}`,
      `Кабинет: ${cabinetUrl}`,
      `Мои документы: ${materialsUrl}`,
      '',
      'Спасибо, что пользуетесь платформой.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="margin:0 0 16px">Оплата получена</h2>
        <p style="margin:0 0 12px">
          Спасибо за покупку. Материалы уже доступны в вашем кабинете.
        </p>
        <div style="margin:0 0 16px;padding:14px 16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px">
          <p style="margin:0 0 8px;font-weight:600">Что оплачено:</p>
          <ul style="margin:0;padding-left:18px">
            ${itemHtml}
          </ul>
          <p style="margin:12px 0 0;font-weight:600">Сумма заказа: ${formatRubles(totalRubles)}</p>
        </div>
        <p style="margin:0 0 12px">
          <a
            href="${materialsUrl}"
            style="display:inline-block;padding:12px 18px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
          >
            Открыть мои документы
          </a>
        </p>
        <p style="margin:0;font-size:13px;color:#6b7280">
          Если кнопка не открывается, используйте ссылку: ${cabinetUrl}
        </p>
      </div>
    `,
  });
}

export async function sendSubscriptionActivatedEmail(params: {
  userId: string;
  planId: string;
  currentPeriodEnd: string;
  wasExtended: boolean;
}): Promise<void> {
  const userResult = await query<{ email: string }>(
    `
      SELECT email
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [params.userId]
  );

  const user = userResult.rows[0];
  if (!user?.email) {
    return;
  }

  const plan = getSubscriptionPlan(params.planId);
  const planLabel = plan?.label ?? params.planId;
  const origin = getAppOrigin();
  const subscriptionUrl = `${origin}/podpiska`;
  const cabinetUrl = `${origin}/kabinet`;
  const endDate = formatDate(params.currentPeriodEnd);
  const subject = params.wasExtended
    ? 'Подписка продлена. Доступ уже обновлён'
    : 'Подписка активирована. Добро пожаловать';

  await sendEmail({
    to: user.email,
    subject,
    text: [
      'Здравствуйте!',
      '',
      params.wasExtended
        ? 'Мы получили оплату и продлили вашу подписку.'
        : 'Мы получили оплату и активировали вашу подписку.',
      `Тариф: ${planLabel}`,
      `Доступ действует до: ${endDate}`,
      '',
      `Страница подписки: ${subscriptionUrl}`,
      `Кабинет: ${cabinetUrl}`,
      '',
      'Спасибо, что пользуетесь платформой.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="margin:0 0 16px">${params.wasExtended ? 'Подписка продлена' : 'Подписка активирована'}</h2>
        <p style="margin:0 0 12px">
          ${params.wasExtended
            ? 'Мы получили оплату и продлили вашу подписку.'
            : 'Мы получили оплату и активировали вашу подписку.'}
        </p>
        <div style="margin:0 0 16px;padding:14px 16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px">
          <p style="margin:0 0 6px"><strong>Тариф:</strong> ${planLabel}</p>
          <p style="margin:0"><strong>Доступ действует до:</strong> ${endDate}</p>
        </div>
        <p style="margin:0 0 12px">
          <a
            href="${subscriptionUrl}"
            style="display:inline-block;padding:12px 18px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
          >
            Открыть подписку
          </a>
        </p>
        <p style="margin:0;font-size:13px;color:#6b7280">
          Если кнопка не открывается, используйте ссылку: ${cabinetUrl}
        </p>
      </div>
    `,
  });
}
