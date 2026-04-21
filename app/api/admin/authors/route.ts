import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

type AuthorRow = {
  id: string;
  user_id: string | null;
  account_email: string | null;
  email_verified_at: string | null;
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: string;
  position: string;
  bio: string;
  employment_type: string;
  document_url: string | null;
  created_at: string;
  updated_at: string;
};

type SummaryRow = {
  total_authors: string;
  linked_accounts: string;
  verified_accounts: string;
  self_employed_count: string;
  ip_count: string;
};

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { error: null };
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const employmentType = searchParams.get('employmentType')?.trim() ?? '';

    const [summaryRes, itemsRes] = await Promise.all([
      query<SummaryRow>(
        `
          SELECT
            COUNT(*)::text AS total_authors,
            COUNT(*) FILTER (WHERE aa.user_id IS NOT NULL)::text AS linked_accounts,
            COUNT(*) FILTER (WHERE u.email_verified_at IS NOT NULL)::text AS verified_accounts,
            COUNT(*) FILTER (WHERE aa.employment_type = 'self_employed')::text AS self_employed_count,
            COUNT(*) FILTER (WHERE aa.employment_type = 'individual_entrepreneur')::text AS ip_count
          FROM author_applications aa
          LEFT JOIN users u ON u.id = aa.user_id
          WHERE aa.status = 'approved'
        `
      ),
      query<AuthorRow>(
        `
          SELECT
            aa.id,
            aa.user_id,
            u.email AS account_email,
            u.email_verified_at,
            aa.name,
            aa.email,
            aa.phone,
            aa.city,
            aa.experience,
            aa.position,
            aa.bio,
            aa.employment_type,
            aa.document_url,
            aa.created_at,
            aa.updated_at
          FROM author_applications aa
          LEFT JOIN users u ON u.id = aa.user_id
          WHERE aa.status = 'approved'
            AND (
              $1 = ''
              OR aa.name ILIKE $2
              OR aa.email ILIKE $2
              OR aa.city ILIKE $2
              OR aa.position ILIKE $2
              OR aa.bio ILIKE $2
              OR COALESCE(u.email, '') ILIKE $2
            )
            AND ($3 = '' OR aa.employment_type = $3)
          ORDER BY aa.updated_at DESC
          LIMIT 100
        `,
        [search, `%${search}%`, employmentType]
      ),
    ]);

    const summary = summaryRes.rows[0];

    return NextResponse.json({
      summary: {
        totalAuthors: Number(summary?.total_authors ?? '0'),
        linkedAccounts: Number(summary?.linked_accounts ?? '0'),
        verifiedAccounts: Number(summary?.verified_accounts ?? '0'),
        selfEmployedCount: Number(summary?.self_employed_count ?? '0'),
        ipCount: Number(summary?.ip_count ?? '0'),
      },
      items: itemsRes.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        accountEmail: row.account_email,
        accountEmailVerified: Boolean(row.email_verified_at),
        name: row.name,
        email: row.email,
        phone: row.phone,
        city: row.city,
        experience: row.experience,
        position: row.position,
        bio: row.bio,
        employmentType: row.employment_type,
        documentUrl: row.document_url ?? '',
        createdAt: new Date(row.created_at).toISOString(),
        approvedAt: new Date(row.updated_at).toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/admin/authors]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
