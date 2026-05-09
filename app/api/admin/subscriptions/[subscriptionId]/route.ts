import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';
import {
  SubscriptionCheckoutError,
  updateSubscriptionByAdmin,
} from '@/src/server/subscriptions';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const { user, error } = await requireAdmin();
    if (error || !user) return error;

    const rateLimit = await consumeRequestRateLimit(request, {
      scope: 'admin-subscription-update',
      limit: 30,
      windowSeconds: 60,
      keyParts: [user.id],
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const { subscriptionId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action.trim() : '';
    const months = typeof body.months === 'number' ? body.months : Number(body.months ?? 1);

    if (!['pause', 'resume', 'cancel', 'expire', 'extend'].includes(action)) {
      return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
    }

    const beforeResult = await query<{
      id: string;
      user_id: string;
      status: string;
      plan_code: string | null;
      current_period_start: string | null;
      current_period_end: string | null;
      updated_at: string;
    }>(
      `
        SELECT id, user_id, status, plan_code, current_period_start, current_period_end, updated_at
        FROM subscriptions
        WHERE id = $1
        LIMIT 1
      `,
      [subscriptionId]
    );
    const before = beforeResult.rows[0];
    if (!before) {
      return NextResponse.json({ error: 'subscription_not_found' }, { status: 404 });
    }

    const updated = await updateSubscriptionByAdmin({
      subscriptionId,
      action: action as 'pause' | 'resume' | 'cancel' | 'expire' | 'extend',
      months,
    });

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before_data, after_data)
       VALUES ($1, 'subscription.update', 'subscription', $2, $3::jsonb, $4::jsonb)`,
      [
        user.id,
        subscriptionId,
        JSON.stringify(before),
        JSON.stringify(updated),
      ]
    );

    return NextResponse.json({ ok: true, subscription: updated });
  } catch (error) {
    if (error instanceof SubscriptionCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('[api/admin/subscriptions/[subscriptionId]]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
