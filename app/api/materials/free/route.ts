import { NextResponse } from 'next/server';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query<{
      id: string; slug: string; title: string;
      short_description: string | null; full_description: string | null;
      category_name: string | null; age_group: string | null;
      file_type: string | null; program: string | null;
    }>(
      `SELECT m.id, m.slug, m.title, m.short_description, m.full_description,
              c.name AS category_name, m.age_group, m.file_type, m.program
       FROM materials m
       LEFT JOIN categories c ON c.id = m.category_id
       WHERE m.access_type = 'free' AND m.is_published = true
       ORDER BY m.title ASC`
    );

    return NextResponse.json({
      items: result.rows.map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        shortDescription: r.short_description ?? '',
        fullDescription: r.full_description ?? '',
        categoryName: r.category_name ?? '',
        ageGroup: r.age_group ?? '',
        fileType: r.file_type ?? 'PDF',
        program: r.program ?? '',
      })),
    });
  } catch (err) {
    console.error('[api/materials/free]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
