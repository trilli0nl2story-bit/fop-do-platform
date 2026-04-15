import { storeProducts, StoreProduct } from '../data/storeProducts';
import { MaterialDoc, AccessType } from '../components/MaterialDocCard';
import { freeMaterials, subscriptionMaterials } from '../data/materials';

export type CmsAccessType = 'store' | 'free' | 'subscription';

export interface CmsProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  categoryId: string;
  categoryName: string;
  ageGroup: string;
  role: string;
  fileType: 'DOCX' | 'PDF' | 'PPTX';
  tags: string[];
  formatLabels: string[];
  previewText: string;
  coverImageUrl: string;
  previewFileUrl: string;
  paidFileUrl: string;
  forWhom: string;
  whatIsInside: string;
  howToUse: string;
  afterPurchase: string;
  whatYouGet: string;
  relatedProductIds: string[];
  isPublished: boolean;
  isFeatured: boolean;
  accessType: CmsAccessType;
  createdAt: string;
  updatedAt: string;
  source: 'cms' | 'hardcoded';
}

const STORAGE_KEY = 'cms_products';

function loadCmsProducts(): CmsProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCmsProducts(products: CmsProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // ignore quota errors
  }
}

function hardcodedToCms(p: typeof storeProducts[0]): CmsProduct {
  return {
    id: `hc-${p.id}`,
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    price: p.price,
    categoryId: p.categorySlug,
    categoryName: p.category,
    ageGroup: p.ageGroup,
    role: '',
    fileType: (p.fileType === 'PPT' ? 'PPTX' : p.fileType) as 'DOCX' | 'PDF' | 'PPTX',
    tags: [],
    formatLabels: [],
    previewText: '',
    coverImageUrl: '',
    previewFileUrl: '',
    paidFileUrl: '',
    forWhom: '',
    whatIsInside: (p.whatIsIncluded ?? []).join('\n'),
    howToUse: '',
    afterPurchase: '',
    whatYouGet: '',
    relatedProductIds: [],
    isPublished: true,
    isFeatured: false,
    accessType: 'store',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'hardcoded',
  };
}

export function getAllProducts(): CmsProduct[] {
  const cmsProducts = loadCmsProducts();
  const cmsIds = new Set(cmsProducts.map(p => p.slug));
  const fallback = storeProducts
    .filter(p => !cmsIds.has(p.slug))
    .map(hardcodedToCms);
  return [...cmsProducts, ...fallback];
}

export function getPublishedProducts(): CmsProduct[] {
  return getAllProducts().filter(p => p.isPublished);
}

export function getProductBySlug(slug: string): CmsProduct | undefined {
  return getAllProducts().find(p => p.slug === slug);
}

export function saveCmsProduct(product: CmsProduct): void {
  const products = loadCmsProducts();
  const idx = products.findIndex(p => p.id === product.id);
  const updated = { ...product, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    products[idx] = updated;
  } else {
    products.unshift(updated);
  }
  saveCmsProducts(products);
}

export function deleteCmsProduct(id: string): void {
  const products = loadCmsProducts().filter(p => p.id !== id);
  saveCmsProducts(products);
}

export function createEmptyProduct(): CmsProduct {
  const now = new Date().toISOString();
  return {
    id: `cms-${Date.now()}`,
    slug: '',
    title: '',
    shortDescription: '',
    fullDescription: '',
    price: 0,
    categoryId: '',
    categoryName: '',
    ageGroup: '',
    role: '',
    fileType: 'PDF',
    tags: [],
    formatLabels: [],
    previewText: '',
    coverImageUrl: '',
    previewFileUrl: '',
    paidFileUrl: '',
    forWhom: '',
    whatIsInside: '',
    howToUse: '',
    afterPurchase: '',
    whatYouGet: '',
    relatedProductIds: [],
    isPublished: false,
    isFeatured: false,
    accessType: 'store',
    createdAt: now,
    updatedAt: now,
    source: 'cms',
  };
}

let _cmsIdCounter = 900000;
function cmsToStoreProduct(p: CmsProduct): StoreProduct {
  return {
    id: p.source === 'hardcoded' && p.id.startsWith('hc-')
      ? parseInt(p.id.replace('hc-', ''), 10) || (_cmsIdCounter++)
      : (_cmsIdCounter++),
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription || p.title,
    fullDescription: p.fullDescription || '',
    category: p.categoryName || p.categoryId,
    categorySlug: p.categoryId,
    ageGroup: p.ageGroup || 'Все возраста',
    price: p.price,
    fileType: (p.fileType === 'PPTX' ? 'PPT' : p.fileType) as 'PDF' | 'DOCX' | 'PPT',
    program: '',
    programColor: 'bg-gray-50 text-gray-500',
    whatIsIncluded: p.whatIsInside ? p.whatIsInside.split('\n').filter(Boolean) : [],
  };
}

export function getMergedStoreProducts(): StoreProduct[] {
  const cmsRaw = loadCmsProducts();
  const cmsPublishedStore = cmsRaw.filter(
    p => p.isPublished && p.source === 'cms' && (p.accessType ?? 'store') === 'store'
  );
  const cmsOverrideSlugs = new Set(
    cmsRaw.filter(p => p.source === 'cms' && (p.accessType ?? 'store') === 'store').map(p => p.slug)
  );

  const base = storeProducts.filter(p => !cmsOverrideSlugs.has(p.slug));
  const cmsConverted = cmsPublishedStore.map(cmsToStoreProduct);
  return [...base, ...cmsConverted];
}

export function getMergedProductBySlug(slug: string): StoreProduct | undefined {
  const cmsRaw = loadCmsProducts();
  const cmsProd = cmsRaw.find(p => p.slug === slug && p.source === 'cms');
  if (cmsProd) {
    if (!cmsProd.isPublished) return undefined;
    return cmsToStoreProduct(cmsProd);
  }
  return storeProducts.find(p => p.slug === slug);
}

function cmsToMaterialDoc(p: CmsProduct, targetAccess: AccessType): MaterialDoc {
  return {
    id: typeof p.id === 'string' && p.id.startsWith('hc-')
      ? parseInt(p.id.replace('hc-', ''), 10) || Date.now()
      : Date.now() + Math.random(),
    title: p.title,
    category: p.categoryName || p.categoryId || 'Прочее',
    ageGroup: p.ageGroup || '3–7 лет',
    description: p.shortDescription || p.title,
    fileType: (p.fileType === 'PPTX' ? 'PPT' : p.fileType) as 'PDF' | 'DOCX' | 'PPT',
    program: '',
    programColor: 'bg-gray-100 text-gray-600',
    price: targetAccess === 'store' ? p.price : undefined,
    accessType: targetAccess,
  };
}

export function getMergedFreeMaterials(): MaterialDoc[] {
  try {
    const cmsRaw = loadCmsProducts();
    const cmsItems = cmsRaw.filter(
      p => p.isPublished && p.source === 'cms' && (p.accessType ?? 'store') === 'free'
    );
    const converted = cmsItems.map(p => cmsToMaterialDoc(p, 'free'));
    return [...freeMaterials, ...converted];
  } catch {
    return freeMaterials;
  }
}

export function getMergedSubscriptionMaterials(): MaterialDoc[] {
  try {
    const cmsRaw = loadCmsProducts();
    const cmsItems = cmsRaw.filter(
      p => p.isPublished && p.source === 'cms' && (p.accessType ?? 'store') === 'subscription'
    );
    const converted = cmsItems.map(p => cmsToMaterialDoc(p, 'subscription'));
    return [...subscriptionMaterials, ...converted];
  } catch {
    return subscriptionMaterials;
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ёе]/g, 'e').replace(/[а]/g, 'a').replace(/[б]/g, 'b')
    .replace(/[в]/g, 'v').replace(/[г]/g, 'g').replace(/[д]/g, 'd')
    .replace(/[ж]/g, 'zh').replace(/[з]/g, 'z').replace(/[и]/g, 'i')
    .replace(/[й]/g, 'y').replace(/[к]/g, 'k').replace(/[л]/g, 'l')
    .replace(/[м]/g, 'm').replace(/[н]/g, 'n').replace(/[о]/g, 'o')
    .replace(/[п]/g, 'p').replace(/[р]/g, 'r').replace(/[с]/g, 's')
    .replace(/[т]/g, 't').replace(/[у]/g, 'u').replace(/[ф]/g, 'f')
    .replace(/[х]/g, 'h').replace(/[ц]/g, 'ts').replace(/[ч]/g, 'ch')
    .replace(/[ш]/g, 'sh').replace(/[щ]/g, 'shch').replace(/[ъ]/g, '')
    .replace(/[ы]/g, 'y').replace(/[ь]/g, '').replace(/[э]/g, 'e')
    .replace(/[ю]/g, 'yu').replace(/[я]/g, 'ya')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
