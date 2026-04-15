import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionUser.id;

    // ── Profile ──────────────────────────────────────────────────────────────
    const profileRes = await query<{
      name: string; last_name: string; patronymic: string;
      role: string; city: string; institution: string; phone: string;
    }>(
      'SELECT name, last_name, patronymic, role, city, institution, phone FROM user_profiles WHERE id = $1',
      [userId]
    );
    const p = profileRes.rows[0];

    // ── Subscription ─────────────────────────────────────────────────────────
    const subRes = await query<{
      status: string; plan_code: string | null; current_period_end: string | null;
    }>(
      `SELECT status, plan_code, current_period_end
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY
         CASE WHEN status = 'active' AND current_period_end > now() THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT 1`,
      [userId]
    );

    let subscription: { status: string; planCode: string | null; currentPeriodEnd: string | null };
    if (subRes.rows.length === 0) {
      subscription = { status: 'none', planCode: null, currentPeriodEnd: null };
    } else {
      const s = subRes.rows[0];
      const isActive = s.status === 'active' &&
        s.current_period_end !== null &&
        new Date(s.current_period_end) > new Date();
      const status = isActive
        ? 'active'
        : s.status === 'active'
          ? 'expired'
          : s.status;
      subscription = {
        status,
        planCode: s.plan_code ?? null,
        currentPeriodEnd: s.current_period_end
          ? new Date(s.current_period_end).toISOString()
          : null,
      };
    }

    // ── Materials ─────────────────────────────────────────────────────────────
    const matCountRes = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM user_materials
       WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > now())`,
      [userId]
    );
    const matTotal = parseInt(matCountRes.rows[0]?.count ?? '0', 10);

    const matItemsRes = await query<{
      id: string; slug: string; title: string;
      access_type: string; granted_at: string; expires_at: string | null;
    }>(
      `SELECT um.id, m.slug, m.title, um.access_type, um.granted_at, um.expires_at
       FROM user_materials um
       JOIN materials m ON m.id = um.material_id
       WHERE um.user_id = $1 AND (um.expires_at IS NULL OR um.expires_at > now())
       ORDER BY um.granted_at DESC
       LIMIT 10`,
      [userId]
    );

    // ── Document requests ─────────────────────────────────────────────────────
    const docCountRes = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM document_requests WHERE user_id = $1',
      [userId]
    );
    const docTotal = parseInt(docCountRes.rows[0]?.count ?? '0', 10);

    const docItemsRes = await query<{
      id: string; description: string; status: string; created_at: string;
    }>(
      `SELECT id, description, status, created_at FROM document_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    return NextResponse.json({
      user: { id: sessionUser.id, email: sessionUser.email, isAdmin: sessionUser.isAdmin },
      profile: {
        name: p?.name ?? '',
        lastName: p?.last_name ?? '',
        patronymic: p?.patronymic ?? '',
        role: p?.role ?? '',
        city: p?.city ?? '',
        institution: p?.institution ?? '',
        phone: p?.phone ?? '',
      },
      subscription,
      materials: {
        total: matTotal,
        items: matItemsRes.rows.map(r => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          accessType: r.access_type,
          grantedAt: new Date(r.granted_at).toISOString(),
          expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
        })),
      },
      documentRequests: {
        total: docTotal,
        items: docItemsRes.rows.map(r => ({
          id: r.id,
          description: r.description,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error('[api/account/summary]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
