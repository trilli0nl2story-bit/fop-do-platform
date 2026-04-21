import type { MetadataRoute } from 'next';
import { storeProducts } from '../src/data/storeProducts';
import { siteUrl } from '../src/lib/siteConfig';
import { getPublishedStoreMaterials } from '../src/server/publicStore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const legalRoutes: MetadataRoute.Sitemap = [
    'oferta',
    'konfidentsialnost',
    'usloviya',
    'soglasie',
    'vozvrat',
    'avtory',
  ].map((slug) => ({
    url: `${siteUrl}/legal/${slug}`,
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.4,
  }));

  let dbProducts: Awaited<ReturnType<typeof getPublishedStoreMaterials>> = [];
  try {
    dbProducts = await getPublishedStoreMaterials(1000);
  } catch {
    dbProducts = [];
  }

  const productSlugs = new Map<string, Date>();
  for (const product of storeProducts) {
    productSlugs.set(product.slug, now);
  }
  for (const product of dbProducts) {
    productSlugs.set(product.slug, product.updatedAt ? new Date(product.updatedAt) : now);
  }

  const productRoutes: MetadataRoute.Sitemap = Array.from(productSlugs.entries()).map(([slug, lastModified]) => ({
    url: `${siteUrl}/materialy/magazin/${slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...legalRoutes, ...productRoutes];
}
