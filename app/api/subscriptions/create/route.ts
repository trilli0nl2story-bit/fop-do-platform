import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { recordSubscriptionCheckoutConsents } from '@/src/server/consents';
import { createSubscriptionCheckout, SubscriptionCheckoutError } from '@/src/server/subscriptions';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type CreateSubscriptionBody = {
  planId?: string;
  consents?: {
    offer?: boolean;
    subscription?: boolean;
    refund?: boolean;
  };
  offerConsent?: boolean;
  subscriptionConsent?: boolean;
  refundConsent?: boolean;
};

function hasSubscriptionConsent(body: CreateSubscriptionBody): boolean {
  const offer = body.consents?.offer === true || body.offerConsent === true;
  const subscription = body.consents?.subscription === true || body.subscriptionConsent === true;
  const refund = body.consents?.refund === true || body.refundConsent === true;
  return offer && subscription && refund;
}

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
    if (!hasSubscriptionConsent(body)) {
      return NextResponse.json(
        {
          error: 'missing_consent',
          message: 'Подтвердите условия оферты, подписки и возврата перед оплатой.',
        },
        { status: 400 }
      );
    }

    const checkout = await createSubscriptionCheckout({
      userId: sessionUser.id,
      planId: typeof body.planId === 'string' ? body.planId : '',
      requestOrigin: new URL(request.url).origin,
      beforePaymentReady: async (payment) => {
        await recordSubscriptionCheckoutConsents(
          {
            userId: sessionUser.id,
            email: sessionUser.email,
            sourceUrl: request.headers.get('referer') ?? '/podpiska',
            metadata: {
              orderId: payment.orderId,
              paymentId: payment.paymentId,
              totalRubles: payment.totalRubles,
              planId: payment.planId,
              months: payment.months,
            },
          },
          request
        );
      },
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
