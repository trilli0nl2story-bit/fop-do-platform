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

async function resolveYandexDiskDownloadUrl(source: string): Promise<string | null> {
  const apiUrl = new URL('https://cloud-api.yandex.net/v1/disk/public/resources/download');
  apiUrl.searchParams.set('public_key', source);

  const response = await fetch(apiUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; metodcab-bot/1.0)',
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = await response.json().catch(() => null) as { href?: unknown } | null;
  return typeof data?.href === 'string' && data.href.trim() ? data.href.trim() : null;
}

async function proxyImageResponse(url: string): Promise<NextResponse | null> {
  const upstream = await fetch(url, {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; metodcab-bot/1.0)',
    },
    cache: 'no-store',
  });

  if (!upstream.ok) return null;

  const contentType = upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!contentType.startsWith('image/')) return null;

  const body = await upstream.arrayBuffer();
  const response = new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Content-Disposition': 'inline',
    },
  });

  return response;
}

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get('source')?.trim() ?? '';
  if (!source || !isYandexDiskPublicAssetUrl(source)) {
    return NextResponse.json({ error: 'Unsupported source' }, { status: 400 });
  }

  try {
    const directDownloadUrl = await resolveYandexDiskDownloadUrl(source);
    if (directDownloadUrl) {
      const proxied = await proxyImageResponse(directDownloadUrl);
      if (proxied) return proxied;
    }

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

    const proxied = await proxyImageResponse(resolved);
    if (!proxied) {
      return NextResponse.json({ error: 'Resolved image could not be loaded' }, { status: 502 });
    }

    return proxied;
  } catch (error) {
    console.error('[api/materials/external-image]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to resolve external image' }, { status: 500 });
  }
}
