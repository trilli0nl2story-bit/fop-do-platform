import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

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

    const result = await query<{
      id: string;
      slug: string;
      name: string;
      sort_order: number | string;
    }>(
      `SELECT id, slug, name, sort_order
       FROM categories
       WHERE is_visible = true
       ORDER BY sort_order ASC, name ASC`
    );

    return NextResponse.json({
      categories: result.rows.map(row => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
      })),
    });
  } catch (err) {
    console.error('[api/admin/categories]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
