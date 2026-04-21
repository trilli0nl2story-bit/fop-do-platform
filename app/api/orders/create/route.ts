import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { createStoreOrderCheckout, CheckoutError } from '@/src/server/orders';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type CreateOrderBody = {
  items?: Array<{ slug?: string }>;
  referralCode?: string | null;
};

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Войдите в аккаунт, чтобы оформить заказ.' },
      { status: 401 }
    );
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    scope: 'orders:create',
    limit: 8,
    windowSeconds: 15 * 60,
    keyParts: [sessionUser.id],
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit, 'Слишком много попыток оформить заказ. Подождите немного и попробуйте снова.');
  }

  try {
    const body = await request.json() as CreateOrderBody;
    const items = Array.isArray(body.items) ? body.items : [];

    const checkout = await createStoreOrderCheckout({
      userId: sessionUser.id,
      items: items
        .map((item) => ({ slug: typeof item?.slug === 'string' ? item.slug : '' }))
        .filter((item) => item.slug.trim().length > 0),
      referralCode: typeof body.referralCode === 'string' ? body.referralCode : null,
      requestOrigin: new URL(request.url).origin,
    });

    return NextResponse.json({
      orderId: checkout.orderId,
      paymentId: checkout.paymentId,
      paymentUrl: checkout.paymentUrl,
      totalRubles: checkout.totalRubles,
      provider: 'prodamus',
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { error: 'checkout_error', message: error.message },
        { status: error.status }
      );
    }

    console.error('[api/orders/create]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'internal_error', message: 'Не удалось оформить заказ. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
