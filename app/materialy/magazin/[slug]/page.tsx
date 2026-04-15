import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storeProducts } from '../../../../src/data/storeProducts';
import { ProductDetailClient } from './client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return storeProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = storeProducts.find((p) => p.slug === slug);
  if (!product) {
    return { title: 'Материал не найден | Методический кабинет педагога' };
  }
  return {
    title: `${product.title} | Магазин материалов ДОУ`,
    description: product.shortDescription,
    alternates: { canonical: `/materialy/magazin/${slug}` },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = storeProducts.find((p) => p.slug === slug);
  if (!product) {
    notFound();
  }
  return <ProductDetailClient slug={slug} />;
}
