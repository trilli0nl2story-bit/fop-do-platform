import type { MetadataRoute } from 'next';
import { siteUrl } from '../src/lib/siteConfig';

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
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
