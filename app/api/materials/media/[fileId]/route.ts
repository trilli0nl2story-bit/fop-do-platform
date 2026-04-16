import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { getMaterialFileBlob } from '@/src/server/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: Promise<{ fileId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { fileId } = await params;
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const fileResult = await query<{
      id: string;
      file_role: string;
      is_published: boolean;
    }>(
      `SELECT mf.id, mf.file_role, m.is_published
       FROM material_files mf
       INNER JOIN materials m ON m.id = mf.material_id
       WHERE mf.id = $1
       LIMIT 1`,
      [fileId]
    );

    if (fileResult.rows.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = fileResult.rows[0];
    if (!['cover', 'preview'].includes(file.file_role)) {
      return NextResponse.json({ error: 'File not public media' }, { status: 404 });
    }

    if (!file.is_published) {
      const user = await getCurrentUser();
      if (!user?.isAdmin) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    const blob = await getMaterialFileBlob(file.id);
    if (!blob) {
      return NextResponse.json({ error: 'File bytes not found' }, { status: 404 });
    }

    return new Response(blob.data, {
      status: 200,
      headers: {
        'Content-Type': blob.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(blob.fileName)}"`,
        'Cache-Control': file.is_published ? 'public, max-age=3600' : 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[api/materials/media/:fileId]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

