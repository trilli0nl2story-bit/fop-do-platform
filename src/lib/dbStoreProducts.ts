import type { StoreProduct } from '../data/storeProducts';

interface DbStoreMaterial {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  categorySlug: string;
  ageGroup: string;
  priceRubles: number;
  fileType: StoreProduct['fileType'];
  program: string;
  coverUrl: string;
  previewText: string;
  previewFileUrl: string;
  seoTitle: string;
  seoDescription: string;
}

function productIdFromSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return 10_000_000 + Math.abs(hash);
}

function programColor(program: string): string {
  const lower = program.toLowerCase();
  if (lower.includes('фоп') || lower.includes('fop')) return 'bg-teal-50 text-teal-700';
  if (lower.includes('фаоп') || lower.includes('faop')) return 'bg-violet-50 text-violet-700';
  return 'bg-gray-100 text-gray-600';
}

export function dbMaterialToStoreProduct(material: DbStoreMaterial): StoreProduct {
  return {
    id: productIdFromSlug(material.slug),
    materialId: material.id,
    slug: material.slug,
    title: material.title,
    shortDescription: material.shortDescription,
    fullDescription: material.fullDescription,
    category: material.category || 'Материалы',
    categorySlug: material.categorySlug || 'materialy',
    ageGroup: material.ageGroup || 'Для педагогов',
    price: material.priceRubles,
    fileType: material.fileType,
    program: material.program || 'Универсальный',
    programColor: programColor(material.program || ''),
    coverUrl: material.coverUrl,
    previewText: material.previewText,
    previewFileUrl: material.previewFileUrl,
    seoTitle: material.seoTitle,
    seoDescription: material.seoDescription,
    whatIsIncluded: [],
  };
}

