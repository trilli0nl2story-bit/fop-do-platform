import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const slug = (body as Record<string, unknown>)?.materialSlug;
    if (typeof slug !== 'string' || !slug.trim()) {
      return NextResponse.json({ error: 'materialSlug is required' }, { status: 400 });
    }

    // Only grant published free materials — never store/subscription
    const matResult = await query<{ id: string; slug: string; title: string }>(
      `SELECT id, slug, title FROM materials
       WHERE slug = $1 AND access_type = 'free' AND is_published = true
       LIMIT 1`,
      [slug.trim()]
    );

    if (matResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found or not free' }, { status: 404 });
    }

    const material = matResult.rows[0];

    await query(
      `INSERT INTO user_materials (user_id, material_id, access_type, granted_at, expires_at)
       VALUES ($1, $2, 'free', now(), null)
       ON CONFLICT (user_id, material_id) DO NOTHING`,
      [sessionUser.id, material.id]
    );

    return NextResponse.json({
      ok: true,
      material: { id: material.id, slug: material.slug, title: material.title },
    });
  } catch (err) {
    console.error('[api/materials/free/grant]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
