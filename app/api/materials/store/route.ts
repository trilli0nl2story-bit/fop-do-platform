import { NextResponse } from 'next/server';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

type StoreMaterialRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  age_group: string;
  file_type: 'PDF' | 'DOCX' | 'PPT' | 'PPTX';
  price: number | string;
  cover_url: string;
  preview_text: string;
  preview_file_url: string;
  seo_title: string;
  seo_description: string;
  program: string;
  category_name: string;
  category_slug: string;
};

function publicMaterial(row: StoreMaterialRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    category: row.category_name || 'Материалы',
    categorySlug: row.category_slug || 'materialy',
    ageGroup: row.age_group || 'Для педагогов',
    priceRubles: Math.round(Number(row.price ?? 0)) / 100,
    fileType: row.file_type,
    program: row.program || 'Универсальный',
    coverUrl: row.cover_url || '',
    previewText: row.preview_text || '',
    previewFileUrl: row.preview_file_url || '',
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
  };
}

export async function GET() {
  try {
    const result = await query<StoreMaterialRow>(
      `SELECT
         m.id,
         m.slug,
         m.title,
         m.short_description,
         m.full_description,
         m.age_group,
         m.file_type,
         m.price,
         m.cover_url,
         m.preview_text,
         m.preview_file_url,
         m.seo_title,
         m.seo_description,
         m.program,
         COALESCE(c.name, '') AS category_name,
         COALESCE(c.slug, '') AS category_slug
       FROM materials m
       LEFT JOIN categories c ON c.id = m.category_id
       WHERE m.access_type = 'store'
         AND m.is_published = true
         AND (c.id IS NULL OR c.is_visible = true)
       ORDER BY m.is_featured DESC, m.updated_at DESC, m.title ASC
       LIMIT 300`
    );

    return NextResponse.json({
      materials: result.rows.map(publicMaterial),
    });
  } catch (err) {
    console.error('[api/materials/store]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ materials: [] }, { status: 200 });
  }
}
