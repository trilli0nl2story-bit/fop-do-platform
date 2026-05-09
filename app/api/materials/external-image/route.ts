import { NextResponse } from 'next/server';
import { isYandexDiskPublicAssetUrl } from '@/src/lib/materialMediaLinks';

export const dynamic = 'force-dynamic';

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/');
}

function extractPreviewUrl(html: string): string | null {
  const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) return decodeHtml(ogImage);

  const previewImage = html.match(/<img[^>]+class=["'][^"']*content__image-preview[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1];
  if (previewImage) return decodeHtml(previewImage);

  const defaultPreview = html.match(/"defaultPreview":"([^"]+)"/)?.[1];
  if (defaultPreview) return decodeHtml(defaultPreview);

  const original = html.match(/"original":"([^"]+)"/)?.[1];
  if (original) return decodeHtml(original);

  return null;
}

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get('source')?.trim() ?? '';
  if (!source || !isYandexDiskPublicAssetUrl(source)) {
    return NextResponse.json({ error: 'Unsupported source' }, { status: 400 });
  }

  try {
    const upstream = await fetch(source, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; metodcab-bot/1.0)',
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Failed to load source image page' }, { status: 502 });
    }

    const html = await upstream.text();
    const resolved = extractPreviewUrl(html);
    if (!resolved) {
      return NextResponse.json({ error: 'Preview image not found' }, { status: 404 });
    }

    const response = NextResponse.redirect(resolved, 307);
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    return response;
  } catch (error) {
    console.error('[api/materials/external-image]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to resolve external image' }, { status: 500 });
  }
}
