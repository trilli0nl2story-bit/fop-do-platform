import type { Metadata } from 'next';
import { dbMaterialToStoreProduct } from '../../../src/lib/dbStoreProducts';
import { siteName, siteUrl } from '../../../src/lib/siteConfig';
import { getPublishedStoreMaterials } from '../../../src/server/publicStore';
import { MagazinClient } from './client';

const pageTitle = 'Магазин документов и материалов для ДОУ';
const pageDescription =
  'Готовые документы, КТП, конспекты и методические материалы для детского сада с быстрым доступом после оплаты.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: '/materialy/magazin' },
  openGraph: {
    title: `${pageTitle} | ${siteName}`,
    description: pageDescription,
    url: '/materialy/magazin',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${pageTitle} | ${siteName}`,
    description: pageDescription,
  },
};

export default async function MagazinPage() {
  const initialProducts = await getPublishedStoreMaterials(300)
    .then((materials) => materials.map(dbMaterialToStoreProduct))
    .catch(() => []);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageTitle,
    url: `${siteUrl}/materialy/magazin`,
    numberOfItems: initialProducts.length,
    itemListElement: initialProducts.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/materialy/magazin/${product.slug}`,
      item: {
        '@type': 'Product',
        name: product.title,
        category: product.category,
        image: product.coverUrl ? [product.coverUrl] : undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'RUB',
          price: product.price,
          availability: 'https://schema.org/InStock',
          url: `${siteUrl}/materialy/magazin/${product.slug}`,
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <MagazinClient initialProducts={initialProducts} />
    </>
  );
}
