import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { getEmailDeliveryDiagnostics, sendEmail } from '@/src/server/email';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    return NextResponse.json({
      ok: true,
      diagnostics: getEmailDeliveryDiagnostics(),
    });
  } catch (error) {
    console.error('[api/admin/email-test][GET]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const rate = await consumeRequestRateLimit(request, {
      scope: 'admin-email-test',
      limit: 5,
      windowSeconds: 10 * 60,
      keyParts: [user.id],
    });
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => ({}));
    const requestedTo = typeof body.to === 'string' ? body.to.trim() : '';
    const to = requestedTo || user.email;

    if (!isEmailLike(to)) {
      return NextResponse.json(
        { error: 'invalid_email', message: 'Укажите корректный email для тестового письма.' },
        { status: 400 }
      );
    }

    const diagnostics = getEmailDeliveryDiagnostics();
    if (!diagnostics.configured) {
      return NextResponse.json(
        {
          ok: false,
          error: 'smtp_not_configured',
          diagnostics,
        },
        { status: 400 }
      );
    }

    const sentAt = new Date().toISOString();
    const result = await sendEmail({
      to,
      subject: 'Проверка SMTP — Методический кабинет педагога',
      text: [
        'Это тестовое письмо из админки Методического кабинета педагога.',
        '',
        `Время проверки: ${sentAt}`,
        '',
        'Если вы получили это письмо, SMTP-доставка работает.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="margin:0 0 12px">Проверка SMTP</h2>
          <p style="margin:0 0 8px">Это тестовое письмо из админки Методического кабинета педагога.</p>
          <p style="margin:0 0 8px">Время проверки: ${sentAt}</p>
          <p style="margin:0">Если вы получили это письмо, SMTP-доставка работает.</p>
        </div>
      `,
    });

    return NextResponse.json({
      ok: result.delivered,
      deliveryMode: result.mode,
      to,
      sentAt,
    });
  } catch (error) {
    console.error('[api/admin/email-test][POST]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        ok: false,
        error: 'smtp_send_failed',
        message: 'SMTP настроен, но тестовое письмо не отправилось. Проверьте пароль приложения, FROM-адрес и права ящика.',
        diagnostics: getEmailDeliveryDiagnostics(),
      },
      { status: 502 }
    );
  }
}
