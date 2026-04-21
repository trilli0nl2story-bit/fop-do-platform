import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { checkMaterialAccess } from '@/src/server/materialAccess';
import { getMaterialFile, createDownloadDescriptor } from '@/src/server/storage';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await consumeRequestRateLimit(request, {
      scope: 'materials-download',
      limit: 60,
      windowSeconds: 5 * 60,
      keyParts: [sessionUser.id],
    });
    if (!rate.allowed) {
      return rateLimitResponse(
        rate,
        'Слишком много запросов на скачивание. Подождите немного и попробуйте ещё раз.'
      );
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

    // Never select paid_file_url, preview_file_url, or storage_key here
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

    // Access must be verified before any file metadata is revealed
    const access = await checkMaterialAccess(sessionUser.id, material.id, material.access_type);
    if (!access.allowed) {
      return NextResponse.json({
        ok: false,
        error: 'access_denied',
        message: access.message ?? 'Доступ к материалу ограничен.',
      }, { status: 403 });
    }

    // Look up the paid file and produce a descriptor (signed URL or placeholder)
    const paidFile = await getMaterialFile(material.id, 'paid');
    const descriptor = await createDownloadDescriptor(paidFile);

    return NextResponse.json({
      ok: true,
      material: {
        id: material.id,
        slug: material.slug,
        title: material.title,
        fileType: material.file_type ?? 'PDF',
      },
      download: descriptor,
    });
  } catch (err) {
    console.error('[api/materials/download]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
