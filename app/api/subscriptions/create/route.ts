import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { createSubscriptionCheckout, SubscriptionCheckoutError } from '@/src/server/subscriptions';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type CreateSubscriptionBody = {
  planId?: string;
};

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Войдите в аккаунт, чтобы оформить подписку.' },
      { status: 401 }
    );
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    scope: 'subscriptions:create',
    limit: 6,
    windowSeconds: 15 * 60,
    keyParts: [sessionUser.id],
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit, 'Слишком много попыток оформить подписку. Подождите немного и попробуйте снова.');
  }

  try {
    const body = await request.json() as CreateSubscriptionBody;
    const checkout = await createSubscriptionCheckout({
      userId: sessionUser.id,
      planId: typeof body.planId === 'string' ? body.planId : '',
      requestOrigin: new URL(request.url).origin,
    });

    return NextResponse.json({
      orderId: checkout.orderId,
      paymentId: checkout.paymentId,
      paymentUrl: checkout.paymentUrl,
      totalRubles: checkout.totalRubles,
      planId: checkout.planId,
      provider: 'prodamus',
    });
  } catch (error) {
    if (error instanceof SubscriptionCheckoutError) {
      return NextResponse.json(
        { error: 'subscription_checkout_error', message: error.message },
        { status: error.status }
      );
    }

    console.error('[api/subscriptions/create]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'internal_error', message: 'Не удалось оформить подписку. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
