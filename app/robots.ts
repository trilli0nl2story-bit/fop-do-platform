import type { MetadataRoute } from 'next';
import { siteUrl } from '../src/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/kabinet',
        '/profil',
        '/moi-materialy',
        '/moi-dokumenty',
        '/korzina',
        '/oplata',
        '/api',
        '/admin',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
