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

function toInt(value: unknown): number {
  const parsed = parseInt(String(value ?? '0'), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') ?? '').trim();
    const accessType = (searchParams.get('accessType') ?? 'all').trim();
    const limitParam = parseInt(searchParams.get('limit') ?? '80', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 150) : 80;

    const values: unknown[] = [];
    const where: string[] = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(m.title ILIKE $${values.length} OR m.slug ILIKE $${values.length})`);
    }

    if (['store', 'free', 'subscription'].includes(accessType)) {
      values.push(accessType);
      where.push(`m.access_type = $${values.length}`);
    }

    values.push(limit);

    const sql = `
      SELECT
        m.id,
        m.slug,
        m.title,
        m.access_type,
        m.file_type,
        m.is_published,
        COALESCE(c.name, '') AS category_name,
        COUNT(mf.id)::int AS file_count
      FROM materials m
      LEFT JOIN categories c ON c.id = m.category_id
      LEFT JOIN material_files mf ON mf.material_id = m.id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY m.id, c.name
      ORDER BY m.is_published DESC, m.title ASC
      LIMIT $${values.length}
    `;

    const result = await query<{
      id: string;
      slug: string;
      title: string;
      access_type: string;
      file_type: string | null;
      is_published: boolean;
      category_name: string;
      file_count: number | string;
    }>(sql, values);

    return NextResponse.json({
      materials: result.rows.map(row => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        accessType: row.access_type,
        fileType: row.file_type,
        isPublished: row.is_published,
        categoryName: row.category_name,
        fileCount: toInt(row.file_count),
      })),
    });
  } catch (err) {
    console.error('[api/admin/materials]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
