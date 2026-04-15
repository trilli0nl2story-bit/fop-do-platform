import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/kabinet',
        '/korzina',
        '/oplata',
        '/api',
        '/admin',
      ],
    },
    sitemap: 'https://metodcab.replit.app/sitemap.xml',
  };
}
