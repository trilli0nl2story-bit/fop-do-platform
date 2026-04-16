import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { registerMaterialFile, isValidFileRole } from '@/src/server/storage';

export const dynamic = 'force-dynamic';

// ── Auth guards ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

// ── GET /api/admin/material-files?materialSlug=... ────────────────────────────

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('materialSlug');
    if (!slug || !slug.trim()) {
      return NextResponse.json({ error: 'materialSlug query param is required' }, { status: 400 });
    }

    const matResult = await query<{
      id: string; slug: string; title: string;
      short_description: string; full_description: string;
      access_type: string; category_id: string | null; file_type: string | null; price: number | string;
      is_published: boolean; is_featured: boolean;
      seo_title: string; seo_description: string; program: string;
    }>(
      `SELECT id, slug, title, short_description, full_description, access_type,
              category_id, file_type, price, is_published, is_featured, seo_title, seo_description, program
       FROM materials WHERE slug = $1 LIMIT 1`,
      [slug.trim()]
    );

    if (matResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const material = matResult.rows[0];

    // Admin may see storage_key — they need it to verify uploads
    const filesResult = await query<{
      id: string; file_role: string; storage_key: string;
      file_size: number | null; created_at: string;
    }>(
      `SELECT id, file_role, storage_key, file_size, created_at
       FROM material_files
       WHERE material_id = $1
       ORDER BY created_at DESC`,
      [material.id]
    );

    return NextResponse.json({
      material: {
        id: material.id,
        slug: material.slug,
        title: material.title,
        shortDescription: material.short_description,
        fullDescription: material.full_description,
        accessType: material.access_type,
        categoryId: material.category_id,
        fileType: material.file_type,
        priceRubles: Math.round(Number(material.price ?? 0)) / 100,
        isPublished: material.is_published,
        isFeatured: material.is_featured,
        seoTitle: material.seo_title,
        seoDescription: material.seo_description,
        program: material.program,
      },
      files: filesResult.rows.map(r => ({
        id: r.id,
        fileRole: r.file_role,
        storageKey: r.storage_key,
        fileSize: r.file_size,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/admin/material-files GET]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/admin/material-files ────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const materialSlug = b?.materialSlug;
    const fileRole = b?.fileRole;
    const storageKey = b?.storageKey;
    const fileSize = b?.fileSize;

    if (typeof materialSlug !== 'string' || !materialSlug.trim()) {
      return NextResponse.json({ error: 'materialSlug is required' }, { status: 400 });
    }
    if (!isValidFileRole(fileRole)) {
      return NextResponse.json({ error: 'fileRole must be one of: paid, preview, cover' }, { status: 400 });
    }
    if (typeof storageKey !== 'string' || !storageKey.trim()) {
      return NextResponse.json({ error: 'storageKey is required' }, { status: 400 });
    }
    if (fileSize !== undefined && fileSize !== null) {
      if (typeof fileSize !== 'number' || fileSize < 0 || !Number.isFinite(fileSize)) {
        return NextResponse.json({ error: 'fileSize must be a positive number or null' }, { status: 400 });
      }
    }

    const matResult = await query<{ id: string }>(
      `SELECT id FROM materials WHERE slug = $1 LIMIT 1`,
      [materialSlug.trim()]
    );

    if (matResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const created = await registerMaterialFile({
      materialId: matResult.rows[0].id,
      fileRole,
      storageKey: storageKey.trim(),
      fileSize: typeof fileSize === 'number' ? fileSize : null,
    });

    return NextResponse.json({ ok: true, file: created }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/material-files POST]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
