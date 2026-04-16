import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

function slugifyTitle(title: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return title
    .toLowerCase()
    .split('')
    .map(ch => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `category-${Date.now()}`;
}

async function makeUniqueSlug(name: string): Promise<string> {
  const base = slugifyTitle(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await query<{ id: string }>(
      'SELECT id FROM categories WHERE slug = $1 LIMIT 1',
      [slug]
    );
    if (existing.rows.length === 0) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const result = await query<{
      id: string;
      slug: string;
      name: string;
      description: string;
      is_visible: boolean;
      sort_order: number | string;
    }>(
      `SELECT id, slug, name, description, is_visible, sort_order
       FROM categories
       ORDER BY sort_order ASC, name ASC`
    );

    return NextResponse.json({
      categories: result.rows.map(row => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        isVisible: row.is_visible,
        sortOrder: Number(row.sort_order ?? 0),
      })),
    });
  } catch (err) {
    console.error('[api/admin/categories]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 180) : '';
    const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 1000) : '';
    const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0;
    const isVisible = typeof body?.isVisible === 'boolean' ? body.isVisible : true;

    if (!name) {
      return NextResponse.json({ error: 'Название раздела обязательно' }, { status: 400 });
    }

    const slug = await makeUniqueSlug(name);
    const result = await query<{
      id: string;
      slug: string;
      name: string;
      description: string;
      is_visible: boolean;
      sort_order: number | string;
    }>(
      `INSERT INTO categories (slug, name, description, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, slug, name, description, is_visible, sort_order`,
      [slug, name, description, isVisible, sortOrder]
    );

    const category = {
      id: result.rows[0].id,
      slug: result.rows[0].slug,
      name: result.rows[0].name,
      description: result.rows[0].description,
      isVisible: result.rows[0].is_visible,
      sortOrder: Number(result.rows[0].sort_order ?? 0),
    };

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before_data, after_data)
       VALUES ($1, 'category.create', 'category', $2, NULL, $3::jsonb)`,
      [user!.id, category.id, JSON.stringify(category)]
    );

    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/categories POST]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
