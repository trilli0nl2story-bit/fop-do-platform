import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

type AuthorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'revision';

const AUTHOR_APPLICATION_STATUSES = new Set<AuthorApplicationStatus>([
  'pending',
  'approved',
  'rejected',
  'revision',
]);

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
    const status = searchParams.get('status')?.trim() ?? '';

    if (status && !AUTHOR_APPLICATION_STATUSES.has(status as AuthorApplicationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await query<{
      id: string;
      user_id: string | null;
      account_email: string | null;
      name: string;
      email: string;
      phone: string;
      city: string;
      experience: string;
      position: string;
      bio: string;
      status: string;
      employment_type: string;
      document_url: string | null;
      admin_note: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT
          aa.id,
          aa.user_id,
          u.email AS account_email,
          aa.name,
          aa.email,
          aa.phone,
          aa.city,
          aa.experience,
          aa.position,
          aa.bio,
          aa.status,
          aa.employment_type,
          aa.document_url,
          aa.admin_note,
          aa.created_at,
          aa.updated_at
        FROM author_applications aa
        LEFT JOIN users u ON u.id = aa.user_id
        WHERE (
          $1 = ''
          OR aa.name ILIKE $2
          OR aa.email ILIKE $2
          OR aa.city ILIKE $2
          OR aa.position ILIKE $2
          OR aa.bio ILIKE $2
          OR COALESCE(u.email, '') ILIKE $2
        )
          AND ($3 = '' OR aa.status = $3)
        ORDER BY aa.created_at DESC
        LIMIT 100
      `,
      [search, `%${search}%`, status]
    );

    return NextResponse.json({
      items: result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        accountEmail: row.account_email,
        name: row.name,
        email: row.email,
        phone: row.phone,
        city: row.city,
        experience: row.experience,
        position: row.position,
        bio: row.bio,
        status: row.status,
        employmentType: row.employment_type,
        documentUrl: row.document_url ?? '',
        adminNote: row.admin_note ?? '',
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/admin/author-applications]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
