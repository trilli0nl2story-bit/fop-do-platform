import { query } from '@/src/server/db';

export type PublicStoreMaterial = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  categorySlug: string;
  ageGroup: string;
  priceRubles: number;
  fileType: 'PDF' | 'DOCX' | 'PPT' | 'PPTX';
  program: string;
  coverUrl: string;
  previewText: string;
  previewFileUrl: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt?: string;
};

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
  updated_at?: string;
  category_name: string;
  category_slug: string;
};

function mapPublicStoreMaterial(row: StoreMaterialRow): PublicStoreMaterial {
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
    updatedAt: row.updated_at,
  };
}

const PUBLIC_STORE_SELECT = `SELECT
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
  m.updated_at,
  COALESCE(c.name, '') AS category_name,
  COALESCE(c.slug, '') AS category_slug
FROM materials m
LEFT JOIN categories c ON c.id = m.category_id
WHERE m.access_type = 'store'
  AND m.is_published = true
  AND (c.id IS NULL OR c.is_visible = true)`;

export async function getPublishedStoreMaterials(limit = 500): Promise<PublicStoreMaterial[]> {
  const result = await query<StoreMaterialRow>(
    `${PUBLIC_STORE_SELECT}
     ORDER BY m.is_featured DESC, m.updated_at DESC, m.title ASC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(mapPublicStoreMaterial);
}

export async function getPublishedStoreMaterialBySlug(
  slug: string
): Promise<PublicStoreMaterial | null> {
  const result = await query<StoreMaterialRow>(
    `${PUBLIC_STORE_SELECT}
     AND m.slug = $1
     LIMIT 1`,
    [slug]
  );

  return result.rows[0] ? mapPublicStoreMaterial(result.rows[0]) : null;
}
