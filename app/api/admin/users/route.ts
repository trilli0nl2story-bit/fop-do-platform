import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { getEffectiveSubscriptionStatus } from '@/src/server/subscriptions';

export const dynamic = 'force-dynamic';

type SummaryRow = {
  total_users: string;
  admin_users: string;
  verified_users: string;
  active_subscriptions: string;
};

type UserRow = {
  id: string;
  email: string;
  is_admin: boolean;
  email_verified_at: string | null;
  created_at: string;
  name: string;
  last_name: string;
  role: string;
  city: string;
  institution: string;
  material_count: string;
  order_count: string;
  paid_total_kopecks: string;
  subscription_status: string | null;
  current_period_end: string | null;
};

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!user.isAdmin) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, error: null };
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() ?? '';
    const filter = url.searchParams.get('filter')?.trim() ?? '';

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const index = params.length;
      conditions.push(`(
        u.email ILIKE $${index}
        OR COALESCE(p.name, '') ILIKE $${index}
        OR COALESCE(p.last_name, '') ILIKE $${index}
        OR COALESCE(p.city, '') ILIKE $${index}
        OR COALESCE(p.institution, '') ILIKE $${index}
      )`);
    }

    if (filter === 'admins') {
      conditions.push('u.is_admin = true');
    } else if (filter === 'unverified') {
      conditions.push('u.email_verified_at IS NULL');
    } else if (filter === 'subscription') {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM subscriptions s2
          WHERE s2.user_id = u.id
            AND s2.status = 'active'
            AND s2.current_period_end > now()
        )
      `);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [summaryRes, usersRes] = await Promise.all([
      query<SummaryRow>(
        `
          SELECT
            COUNT(*)::text AS total_users,
            COUNT(*) FILTER (WHERE is_admin = true)::text AS admin_users,
            COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::text AS verified_users,
            (
              SELECT COUNT(*)::text
              FROM (
                SELECT DISTINCT user_id
                FROM subscriptions
                WHERE status = 'active'
                  AND current_period_end > now()
              ) active_users
            ) AS active_subscriptions
          FROM users
        `
      ),
      query<UserRow>(
        `
          SELECT
            u.id,
            u.email,
            u.is_admin,
            u.email_verified_at,
            u.created_at,
            COALESCE(p.name, '') AS name,
            COALESCE(p.last_name, '') AS last_name,
            COALESCE(p.role, '') AS role,
            COALESCE(p.city, '') AS city,
            COALESCE(p.institution, '') AS institution,
            COALESCE(mat.material_count, 0)::text AS material_count,
            COALESCE(ord.order_count, 0)::text AS order_count,
            COALESCE(ord.paid_total_kopecks, 0)::text AS paid_total_kopecks,
            sub.status AS subscription_status,
            sub.current_period_end
          FROM users u
          LEFT JOIN user_profiles p ON p.id = u.id
          LEFT JOIN LATERAL (
            SELECT COUNT(*) AS material_count
            FROM user_materials um
            WHERE um.user_id = u.id
              AND (um.expires_at IS NULL OR um.expires_at > now())
          ) mat ON true
          LEFT JOIN LATERAL (
            SELECT
              COUNT(*) AS order_count,
              COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS paid_total_kopecks
            FROM orders o
            WHERE o.user_id = u.id
          ) ord ON true
          LEFT JOIN LATERAL (
            SELECT status, current_period_end
            FROM subscriptions s
            WHERE s.user_id = u.id
            ORDER BY
              CASE WHEN s.status = 'active' AND s.current_period_end > now() THEN 0 ELSE 1 END,
              s.created_at DESC
            LIMIT 1
          ) sub ON true
          ${whereSql}
          ORDER BY u.created_at DESC
          LIMIT 100
        `,
        params
      ),
    ]);

    const summary = summaryRes.rows[0];

    return NextResponse.json({
      summary: {
        totalUsers: Number(summary?.total_users ?? '0'),
        adminUsers: Number(summary?.admin_users ?? '0'),
        verifiedUsers: Number(summary?.verified_users ?? '0'),
        activeSubscriptions: Number(summary?.active_subscriptions ?? '0'),
      },
      items: usersRes.rows.map((row) => {
        const effectiveSubscriptionStatus = row.subscription_status
          ? getEffectiveSubscriptionStatus(row.subscription_status, row.current_period_end)
          : 'none';

        return {
          id: row.id,
          email: row.email,
          isAdmin: row.is_admin,
          emailVerified: Boolean(row.email_verified_at),
          createdAt: new Date(row.created_at).toISOString(),
          profile: {
            name: row.name,
            lastName: row.last_name,
            role: row.role,
            city: row.city,
            institution: row.institution,
          },
          materialsCount: Number(row.material_count ?? '0'),
          ordersCount: Number(row.order_count ?? '0'),
          paidTotalRubles: Math.round(Number(row.paid_total_kopecks ?? '0') / 100),
          subscription: {
            status: effectiveSubscriptionStatus,
            currentPeriodEnd: row.current_period_end
              ? new Date(row.current_period_end).toISOString()
              : null,
          },
        };
      }),
    });
  } catch (error) {
    console.error('[api/admin/users]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
