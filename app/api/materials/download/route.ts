import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { checkMaterialAccess } from '@/src/server/materialAccess';

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

    // Never expose paid_file_url, preview_file_url, or storage_key
    const matResult = await query<{
      id: string; slug: string; title: string;
      access_type: string; file_type: string | null;
    }>(
      `SELECT id, slug, title, access_type, file_type
       FROM materials
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [slug.trim()]
    );

    if (matResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const material = matResult.rows[0];
    const access = await checkMaterialAccess(sessionUser.id, material.id, material.access_type);

    if (!access.allowed) {
      return NextResponse.json({
        ok: false,
        error: 'access_denied',
        message: access.message ?? 'Доступ к материалу ограничен.',
      }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      material: {
        id: material.id,
        slug: material.slug,
        title: material.title,
        fileType: material.file_type ?? 'PDF',
      },
      download: {
        status: 'file_not_uploaded',
        message: 'Файл скоро появится в личном кабинете. Доступ уже закреплён за вашим аккаунтом.',
      },
    });
  } catch (err) {
    console.error('[api/materials/download]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
