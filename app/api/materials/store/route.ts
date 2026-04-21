import { NextResponse } from 'next/server';
import { getPublishedStoreMaterials } from '@/src/server/publicStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      materials: await getPublishedStoreMaterials(300),
    });
  } catch (err) {
    console.error('[api/materials/store]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ materials: [] }, { status: 200 });
  }
}
