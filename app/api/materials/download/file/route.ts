import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { checkMaterialAccess } from '@/src/server/materialAccess';
import { getMaterialFileBlob } from '@/src/server/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function contentDisposition(filename: string) {
  const safeFallback = filename.replace(/[^\w.-]+/g, '_') || 'material-file';
  return `attachment; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const fileRes = await query<{
      material_id: string;
      access_type: string;
      is_published: boolean;
    }>(
      `SELECT m.id AS material_id, m.access_type, m.is_published
       FROM material_files mf
       JOIN materials m ON m.id = mf.material_id
       WHERE mf.id = $1
       LIMIT 1`,
      [fileId]
    );

    if (fileRes.rows.length === 0 || !fileRes.rows[0].is_published) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileInfo = fileRes.rows[0];
    const access = await checkMaterialAccess(sessionUser.id, fileInfo.material_id, fileInfo.access_type);
    if (!access.allowed) {
      return NextResponse.json({
        ok: false,
        error: 'access_denied',
        message: access.message ?? 'Доступ к материалу ограничен.',
      }, { status: 403 });
    }

    const blob = await getMaterialFileBlob(fileId);
    if (!blob) {
      return NextResponse.json({ error: 'File content not found' }, { status: 404 });
    }

    return new Response(new Uint8Array(blob.data), {
      status: 200,
      headers: {
        'Content-Type': blob.contentType,
        'Content-Length': String(blob.data.length),
        'Content-Disposition': contentDisposition(blob.fileName),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[api/materials/download/file]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
