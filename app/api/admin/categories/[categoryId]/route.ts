import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ categoryId: string }>;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

function publicCategory(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_visible: boolean;
  sort_order: number | string;
}) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isVisible: row.is_visible,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const { categoryId } = await params;
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 180) : '';
    const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 1000) : '';
    const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0;
    const isVisible = typeof body?.isVisible === 'boolean' ? body.isVisible : true;

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Название раздела обязательно' }, { status: 400 });
    }

    const beforeResult = await query<{
      id: string;
      slug: string;
      name: string;
      description: string;
      is_visible: boolean;
      sort_order: number | string;
    }>(
      `SELECT id, slug, name, description, is_visible, sort_order
       FROM categories
       WHERE id = $1
       LIMIT 1`,
      [categoryId]
    );

    if (beforeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Раздел не найден' }, { status: 404 });
    }

    const afterResult = await query<typeof beforeResult.rows[0]>(
      `UPDATE categories
       SET name = $2,
           description = $3,
           is_visible = $4,
           sort_order = $5
       WHERE id = $1
       RETURNING id, slug, name, description, is_visible, sort_order`,
      [categoryId, name, description, isVisible, sortOrder]
    );

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before_data, after_data)
       VALUES ($1, 'category.update', 'category', $2, $3::jsonb, $4::jsonb)`,
      [
        user!.id,
        categoryId,
        JSON.stringify(publicCategory(beforeResult.rows[0])),
        JSON.stringify(publicCategory(afterResult.rows[0])),
      ]
    );

    return NextResponse.json({ ok: true, category: publicCategory(afterResult.rows[0]) });
  } catch (err) {
    console.error('[api/admin/categories/:categoryId PATCH]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

