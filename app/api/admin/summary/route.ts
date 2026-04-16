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

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const [
      users,
      categories,
      materials,
      materialFiles,
      orders,
      recentFiles,
      recentUsers,
    ] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) AS count FROM users'),
      query<{ count: string }>('SELECT COUNT(*) AS count FROM categories'),
      query<{
        total: string;
        store: string;
        free: string;
        subscription: string;
        published: string;
      }>(
        `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE access_type = 'store') AS store,
          COUNT(*) FILTER (WHERE access_type = 'free') AS free,
          COUNT(*) FILTER (WHERE access_type = 'subscription') AS subscription,
          COUNT(*) FILTER (WHERE is_published = true) AS published
         FROM materials`
      ),
      query<{ count: string }>('SELECT COUNT(*) AS count FROM material_files'),
      query<{
        total: string;
        paid: string;
        revenue_kopecks: string | null;
      }>(
        `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'paid') AS paid,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS revenue_kopecks
         FROM orders`
      ),
      query<{
        id: string;
        file_role: string;
        storage_key: string;
        file_size: string | null;
        created_at: string;
        material_title: string;
        material_slug: string;
      }>(
        `SELECT mf.id, mf.file_role, mf.storage_key, mf.file_size, mf.created_at,
                m.title AS material_title, m.slug AS material_slug
         FROM material_files mf
         JOIN materials m ON m.id = mf.material_id
         ORDER BY mf.created_at DESC
         LIMIT 5`
      ),
      query<{ id: string; email: string; is_admin: boolean; created_at: string }>(
        `SELECT id, email, is_admin, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT 5`
      ),
    ]);

    const materialStats = materials.rows[0] ?? {};
    const orderStats = orders.rows[0] ?? {};

    return NextResponse.json({
      stats: {
        users: toInt(users.rows[0]?.count),
        categories: toInt(categories.rows[0]?.count),
        materials: {
          total: toInt(materialStats.total),
          store: toInt(materialStats.store),
          free: toInt(materialStats.free),
          subscription: toInt(materialStats.subscription),
          published: toInt(materialStats.published),
        },
        files: toInt(materialFiles.rows[0]?.count),
        orders: {
          total: toInt(orderStats.total),
          paid: toInt(orderStats.paid),
          revenueRubles: Math.round(toInt(orderStats.revenue_kopecks) / 100),
        },
      },
      recentFiles: recentFiles.rows.map(row => ({
        id: row.id,
        fileRole: row.file_role,
        storageKey: row.storage_key,
        fileSize: row.file_size ? toInt(row.file_size) : null,
        createdAt: new Date(row.created_at).toISOString(),
        materialTitle: row.material_title,
        materialSlug: row.material_slug,
      })),
      recentUsers: recentUsers.rows.map(row => ({
        id: row.id,
        email: row.email,
        isAdmin: row.is_admin,
        createdAt: new Date(row.created_at).toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/admin/summary]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
