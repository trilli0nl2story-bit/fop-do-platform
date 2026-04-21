import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { ensureReferralTables } from '@/src/server/referrals';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { error: null };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await ensureReferralTables();

    const [profiles, claims] = await Promise.all([
      query<{
        user_id: string;
        referral_code: string;
        discount_pct: number | string;
        user_email: string;
        registered_count: string;
        paid_count: string;
      }>(
        `
          SELECT
            rp.user_id,
            rp.referral_code,
            rp.discount_pct,
            u.email AS user_email,
            COUNT(rc.*)::text AS registered_count,
            COUNT(*) FILTER (WHERE rc.status = 'paid')::text AS paid_count
          FROM referral_profiles rp
          JOIN users u ON u.id = rp.user_id
          LEFT JOIN referral_claims rc ON rc.referrer_id = rp.user_id
          GROUP BY rp.user_id, rp.referral_code, rp.discount_pct, u.email
          ORDER BY COUNT(*) FILTER (WHERE rc.status = 'paid') DESC, COUNT(rc.*) DESC, u.email ASC
          LIMIT 50
        `
      ),
      query<{
        id: string;
        referral_code: string;
        discount_pct: number | string;
        status: string;
        updated_at: string;
        order_id: string | null;
        referrer_email: string;
        referred_email: string;
      }>(
        `
          SELECT
            rc.id,
            rc.referral_code,
            rc.discount_pct,
            rc.status,
            rc.updated_at,
            rc.order_id,
            referrer.email AS referrer_email,
            referred.email AS referred_email
          FROM referral_claims rc
          JOIN users referrer ON referrer.id = rc.referrer_id
          JOIN users referred ON referred.id = rc.referred_id
          ORDER BY rc.updated_at DESC
          LIMIT 50
        `
      ),
    ]);

    return NextResponse.json({
      profiles: profiles.rows.map((row) => ({
        userId: row.user_id,
        referralCode: row.referral_code,
        discountPercent: Number(row.discount_pct ?? 0),
        userEmail: row.user_email,
        registeredCount: Number(row.registered_count ?? '0'),
        paidCount: Number(row.paid_count ?? '0'),
      })),
      claims: claims.rows.map((row) => ({
        id: row.id,
        referralCode: row.referral_code,
        discountPercent: Number(row.discount_pct ?? 0),
        status: row.status,
        updatedAt: new Date(row.updated_at).toISOString(),
        orderId: row.order_id,
        referrerEmail: row.referrer_email,
        referredEmail: row.referred_email,
      })),
    });
  } catch (err) {
    console.error('[api/admin/referrals]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
