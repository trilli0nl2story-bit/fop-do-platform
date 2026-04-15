const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#3b82f6"/>
  <text x="16" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#fff">M</text>
</svg>`;

export const dynamic = 'force-static';

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
