import { NextResponse } from 'next/server';
import {
  bumpUserSessionVersion,
  getCurrentUser,
  getSessionUserById,
} from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!currentUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rateLimit = await consumeRequestRateLimit(request, {
      scope: 'admin-users-write',
      limit: 20,
      windowSeconds: 5 * 60,
      keyParts: [currentUser.id],
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const { userId } = await context.params;
    const body = (await request.json().catch(() => null)) as { action?: unknown } | null;
    const action = typeof body?.action === 'string' ? body.action : '';

    if (action !== 'reset_sessions') {
      return NextResponse.json(
        { error: 'Поддерживается только действие reset_sessions.' },
        { status: 400 }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Для своего аккаунта используйте кнопку "Выйти на всех устройствах" в кабинете.' },
        { status: 400 }
      );
    }

    const targetBefore = await getSessionUserById(userId);
    if (!targetBefore) {
      return NextResponse.json({ error: 'Пользователь не найден.' }, { status: 404 });
    }

    const targetAfter = await bumpUserSessionVersion(userId);
    if (!targetAfter) {
      return NextResponse.json({ error: 'Не удалось обновить сессии пользователя.' }, { status: 500 });
    }

    await query(
      `
        INSERT INTO admin_audit_log (
          admin_id,
          action,
          target_type,
          target_id,
          before_data,
          after_data,
          created_at
        )
        VALUES ($1, 'user.sessions.reset', 'user', $2, $3::jsonb, $4::jsonb, now())
      `,
      [
        currentUser.id,
        userId,
        JSON.stringify({
          email: targetBefore.email,
          sessionVersion: targetBefore.sessionVersion,
        }),
        JSON.stringify({
          email: targetAfter.email,
          sessionVersion: targetAfter.sessionVersion,
        }),
      ]
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: targetAfter.id,
        email: targetAfter.email,
      },
      message: 'Все старые сессии пользователя завершены.',
    });
  } catch (error) {
    console.error('[api/admin/users/[userId]]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
