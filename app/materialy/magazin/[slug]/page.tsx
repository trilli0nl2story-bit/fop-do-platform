import type { Metadata } from 'next';
import { siteName, siteUrl } from '../../../../src/lib/siteConfig';
import {
  getPublishedStoreMaterialBySlug,
  getPublishedStoreMaterials,
} from '../../../../src/server/publicStore';
import { dbMaterialToStoreProduct } from '../../../../src/lib/dbStoreProducts';
import { ProductDetailClient } from './client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const materials = await getPublishedStoreMaterials(500).catch(() => []);
  return materials.map((material) => ({ slug: material.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const material = await getPublishedStoreMaterialBySlug(slug).catch(() => null);
  const product = material
    ? {
        title: material.seoTitle || material.title,
        description: material.seoDescription || material.shortDescription,
        coverUrl: material.coverUrl,
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
  const initialProduct = await getPublishedStoreMaterialBySlug(slug)
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
