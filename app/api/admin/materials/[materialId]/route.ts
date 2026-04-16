import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

const ACCESS_TYPES = new Set(['free', 'subscription', 'store']);
const FILE_TYPES = new Set(['PDF', 'DOCX', 'PPT', 'PPTX']);

interface Params {
  params: Promise<{ materialId: string }>;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}

function cleanUrl(value: unknown, maxLength = 1000): string | null {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  const iframeSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  const trimmed = (iframeSrc ?? raw).trim().slice(0, maxLength);
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

function boolValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function priceToKopecks(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 500000) return null;
  return Math.round(numeric * 100);
}

function buildSeoFields(params: {
  title: string;
  shortDescription: string;
  previewText: string;
  fullDescription: string;
}) {
  const source = (
    params.shortDescription ||
    params.previewText ||
    params.fullDescription ||
    params.title
  ).trim();

  return {
    title: `${params.title.trim()} — материал для педагогов`,
    description: source.slice(0, 180),
  };
}

async function normalizeCategoryId(value: unknown): Promise<string | null> {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('Раздел выбран неверно');

  const result = await query<{ id: string }>(
    'SELECT id FROM categories WHERE id = $1 LIMIT 1',
    [value]
  );
  if (result.rows.length === 0) throw new Error('Раздел не найден');
  return value;
}

function publicMaterial(row: {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  access_type: string;
  category_id: string | null;
  file_type: string;
  price: number | string;
  cover_url: string;
  preview_text: string;
  preview_file_url: string;
  is_published: boolean;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  program: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    accessType: row.access_type,
    categoryId: row.category_id,
    fileType: row.file_type,
    priceRubles: Math.round(Number(row.price ?? 0)) / 100,
    coverUrl: row.cover_url,
    previewText: row.preview_text,
    previewFileUrl: row.preview_file_url,
    isPublished: row.is_published,
    isFeatured: row.is_featured,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    program: row.program,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const { materialId } = await params;
    if (!materialId) {
      return NextResponse.json({ error: 'materialId is required' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const beforeResult = await query<{
      id: string;
      slug: string;
      title: string;
      short_description: string;
      full_description: string;
      access_type: string;
      category_id: string | null;
      file_type: string;
      price: number | string;
      cover_url: string;
      preview_text: string;
      preview_file_url: string;
      is_published: boolean;
      is_featured: boolean;
      seo_title: string;
      seo_description: string;
      program: string;
      updated_at: string;
    }>(
      `SELECT id, slug, title, short_description, full_description, access_type, category_id, file_type,
              cover_url, preview_text, preview_file_url,
              price, is_published, is_featured, seo_title, seo_description, program, updated_at
       FROM materials
       WHERE id = $1
       LIMIT 1`,
      [materialId]
    );

    if (beforeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const before = beforeResult.rows[0];

    const title = cleanText(body.title, 220);
    const shortDescription = cleanText(body.shortDescription, 500);
    const fullDescription = cleanText(body.fullDescription, 5000);
    const seoTitle = cleanText(body.seoTitle, 220);
    const seoDescription = cleanText(body.seoDescription, 500);
    const program = cleanText(body.program, 160);
    const coverUrl = cleanUrl(body.coverUrl);
    const previewText = cleanText(body.previewText, 1000);
    const previewFileUrl = cleanUrl(body.previewFileUrl);
    const accessType = cleanText(body.accessType, 30);
    const fileType = cleanText(body.fileType, 10);
    const price = priceToKopecks(body.priceRubles);
    const isPublished = boolValue(body.isPublished);
    const isFeatured = boolValue(body.isFeatured);

    if (!title) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }
    if (!accessType || !ACCESS_TYPES.has(accessType)) {
      return NextResponse.json({ error: 'Тип доступа должен быть free, subscription или store' }, { status: 400 });
    }
    if (!fileType || !FILE_TYPES.has(fileType)) {
      return NextResponse.json({ error: 'Тип файла должен быть PDF, DOCX, PPT или PPTX' }, { status: 400 });
    }
    if (price === null) {
      return NextResponse.json({ error: 'Цена должна быть числом от 0 до 500000 рублей' }, { status: 400 });
    }
    if (coverUrl === null) {
      return NextResponse.json({ error: 'Ссылка на основную картинку должна начинаться с http://, https:// или /' }, { status: 400 });
    }
    if (previewFileUrl === null) {
      return NextResponse.json({ error: 'Ссылка на превью или видео должна начинаться с http://, https:// или /' }, { status: 400 });
    }
    if (isPublished === null || isFeatured === null) {
      return NextResponse.json({ error: 'Статусы должны быть включены или выключены' }, { status: 400 });
    }

    let categoryId: string | null;
    try {
      categoryId = await normalizeCategoryId(body.categoryId);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Раздел выбран неверно' }, { status: 400 });
    }

    const normalizedPrice = accessType === 'store' ? price : 0;
    const seoFallback = buildSeoFields({
      title,
      shortDescription: shortDescription ?? '',
      previewText: previewText ?? '',
      fullDescription: fullDescription ?? '',
    });

    const afterResult = await query<typeof before>(
      `UPDATE materials
       SET title = $2,
           short_description = $3,
           full_description = $4,
           access_type = $5,
           category_id = $6,
           file_type = $7,
           price = $8,
           cover_url = $9,
           preview_text = $10,
           preview_file_url = $11,
           is_published = $12,
           is_featured = $13,
           seo_title = $14,
           seo_description = $15,
           program = $16,
           updated_at = now()
       WHERE id = $1
       RETURNING id, slug, title, short_description, full_description, access_type, category_id, file_type,
                 price, cover_url, preview_text, preview_file_url, is_published, is_featured,
                 seo_title, seo_description, program, updated_at`,
      [
        materialId,
        title,
        shortDescription ?? '',
        fullDescription ?? '',
        accessType,
        categoryId,
        fileType,
        normalizedPrice,
        coverUrl,
        previewText ?? '',
        previewFileUrl,
        isPublished,
        isFeatured,
        seoTitle || seoFallback.title,
        seoDescription || seoFallback.description,
        program ?? '',
      ]
    );

    const after = afterResult.rows[0];

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before_data, after_data)
       VALUES ($1, 'material.update', 'material', $2, $3::jsonb, $4::jsonb)`,
      [
        user!.id,
        materialId,
        JSON.stringify(publicMaterial(before)),
        JSON.stringify(publicMaterial(after)),
      ]
    );

    return NextResponse.json({
      ok: true,
      material: publicMaterial(after),
    });
  } catch (err) {
    console.error('[api/admin/materials/:materialId PATCH]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
