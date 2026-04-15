import { STORE_CATEGORIES, storeProducts } from '../data/storeProducts';

export interface CmsCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  isVisible: boolean;
  docCount: number;
  source: 'cms' | 'hardcoded';
}

const STORAGE_KEY = 'cms_categories';

function loadCmsCategories(): CmsCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function slugify(name: string): string {
  return name
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

const HARDCODED: CmsCategory[] = STORE_CATEGORIES
  .filter(c => c !== 'Все категории')
  .map((name, i) => ({
    id: `hc-${i}`,
    name,
    slug: slugify(name),
    order: i + 1,
    isVisible: true,
    docCount: 0,
    source: 'hardcoded' as const,
  }));

export function getAllCategories(): CmsCategory[] {
  const cmsCategories = loadCmsCategories();
  const cmsNames = new Set(cmsCategories.map(c => c.name));
  const fallback = HARDCODED.filter(c => !cmsNames.has(c.name));
  return [...cmsCategories, ...fallback].sort((a, b) => a.order - b.order);
}

export function getVisibleCategories(): CmsCategory[] {
  return getAllCategories().filter(c => c.isVisible);
}

export function saveCmsCategory(cat: CmsCategory): void {
  const cats = loadCmsCategories();
  const idx = cats.findIndex(c => c.id === cat.id);
  if (idx >= 0) {
    cats[idx] = cat;
  } else {
    cats.push(cat);
  }
  saveCmsCategories(cats);
}

export function saveCmsCategories(cats: CmsCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
  } catch {
    // ignore
  }
}

export function deleteCmsCategory(id: string): void {
  const cats = loadCmsCategories().filter(c => c.id !== id);
  saveCmsCategories(cats);
}

export function createCategory(name: string): CmsCategory {
  const all = getAllCategories();
  const maxOrder = all.reduce((m, c) => Math.max(m, c.order), 0);
  return {
    id: `cms-cat-${Date.now()}`,
    name,
    slug: slugify(name),
    order: maxOrder + 1,
    isVisible: true,
    docCount: 0,
    source: 'cms',
  };
}

export function reorderCategories(cats: CmsCategory[]): CmsCategory[] {
  return cats.map((c, i) => ({ ...c, order: i + 1 }));
}

export function getAllCategoriesWithCounts(): CmsCategory[] {
  let mergedProducts: { category: string }[];
  try {
    const raw = localStorage.getItem('cms_products');
    const cmsRaw: Array<{ isPublished: boolean; source: string; categoryName: string; categoryId: string; slug: string }> =
      raw ? JSON.parse(raw) : [];
    const cmsPublished = cmsRaw.filter(p => p.isPublished && p.source === 'cms');
    const cmsOverrideSlugs = new Set(cmsRaw.filter(p => p.source === 'cms').map(p => p.slug));
    const base = storeProducts.filter(p => !cmsOverrideSlugs.has(p.slug)).map(p => ({ category: p.category }));
    const cmsConverted = cmsPublished.map(p => ({ category: p.categoryName || p.categoryId }));
    mergedProducts = [...base, ...cmsConverted];
  } catch {
    mergedProducts = storeProducts.map(p => ({ category: p.category }));
  }

  const countMap: Record<string, number> = {};
  for (const p of mergedProducts) {
    countMap[p.category] = (countMap[p.category] || 0) + 1;
  }

  return getAllCategories().map(c => ({ ...c, docCount: countMap[c.name] || 0 }));
}
