import type { Metadata } from 'next';
import { storeProducts } from '../../../../src/data/storeProducts';
import { siteName, siteUrl } from '../../../../src/lib/siteConfig';
import { getPublishedStoreMaterialBySlug } from '../../../../src/server/publicStore';
import { dbMaterialToStoreProduct } from '../../../../src/lib/dbStoreProducts';
import { ProductDetailClient } from './client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return storeProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const localProduct = storeProducts.find((p) => p.slug === slug);
  const dbProduct = localProduct ? null : await getPublishedStoreMaterialBySlug(slug).catch(() => null);

  const product = localProduct
    ? {
        title: localProduct.seoTitle || localProduct.title,
        description: localProduct.seoDescription || localProduct.shortDescription,
        coverUrl: localProduct.coverUrl,
      }
    : dbProduct
      ? {
          title: dbProduct.seoTitle || dbProduct.title,
          description: dbProduct.seoDescription || dbProduct.shortDescription,
          coverUrl: dbProduct.coverUrl,
        }
      : null;

  if (!product) {
    return { title: `Материал не найден | ${siteName}` };
  }

  const images = product.coverUrl ? [product.coverUrl] : undefined;

  return {
    title: `${product.title} | Магазин материалов ДОУ`,
    description: product.description,
    alternates: { canonical: `/materialy/magazin/${slug}` },
    openGraph: {
      title: product.title,
      description: product.description,
      url: `/materialy/magazin/${slug}`,
      type: 'article',
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: product.title,
      description: product.description,
      images,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const localProduct = storeProducts.find((p) => p.slug === slug) ?? null;
  const initialProduct = localProduct
    ?? await getPublishedStoreMaterialBySlug(slug)
      .then((material) => (material ? dbMaterialToStoreProduct(material) : null))
      .catch(() => null);

  const productSchema = initialProduct
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: initialProduct.title,
        description: initialProduct.seoDescription || initialProduct.shortDescription,
        image: initialProduct.coverUrl ? [initialProduct.coverUrl] : undefined,
        category: initialProduct.category,
        sku: initialProduct.materialId || initialProduct.slug,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'RUB',
          price: initialProduct.price,
          availability: 'https://schema.org/InStock',
          url: `${siteUrl}/materialy/magazin/${slug}`,
        },
      }
    : null;

  return (
    <>
      {productSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      ) : null}
      <ProductDetailClient slug={slug} initialProduct={initialProduct} />
    </>
  );
}
