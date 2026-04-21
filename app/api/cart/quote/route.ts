import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { quoteCart } from '@/src/server/cartQuote';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type QuoteRequestBody = {
  items?: Array<{ slug?: string }>;
  referralCode?: string | null;
};

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const rateLimit = await consumeRequestRateLimit(request, {
    scope: 'cart:quote',
    limit: 40,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json() as QuoteRequestBody;
    const items = Array.isArray(body.items) ? body.items : [];

    const quote = await quoteCart({
      items: items
        .map((item) => ({ slug: typeof item?.slug === 'string' ? item.slug : '' }))
        .filter((item) => item.slug.trim().length > 0),
      referralCode: typeof body.referralCode === 'string' ? body.referralCode : null,
      userId: (await getCurrentUser())?.id ?? null,
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('[api/cart/quote]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'internal_error', message: 'Не удалось пересчитать корзину. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
