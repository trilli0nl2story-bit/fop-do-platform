import { NextResponse } from 'next/server';
import { getPublishedStoreMaterialBySlug } from '@/src/server/publicStore';

interface Params {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const material = await getPublishedStoreMaterialBySlug(slug);
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json({ material });
  } catch (err) {
    console.error('[api/materials/store/:slug]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
