import type { MetadataRoute } from 'next';
import { storeProducts } from '../src/data/storeProducts';
import { siteUrl } from '../src/lib/siteConfig';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/materialy`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/materialy/magazin`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/materialy/besplatno`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/materialy/podpiska`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = storeProducts.map((p) => ({
    url: `${siteUrl}/materialy/magazin/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
