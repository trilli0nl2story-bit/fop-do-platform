import { storeProducts } from '../data/storeProducts';
import { query } from './db';
import { resolveReferralDiscountForUser } from './referrals';

export const MAX_CART_DISCOUNT_PERCENT = 35;
export const SUBSCRIPTION_STORE_DISCOUNT_PERCENT = 25;
export const DEFAULT_REFERRAL_DISCOUNT_PERCENT = 5;

type MaterialRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  file_type: 'PDF' | 'DOCX' | 'PPT' | 'PPTX';
  price: number | string;
  access_type: 'store' | 'free' | 'subscription';
  is_published: boolean;
  category_name: string;
};

export interface CartQuoteInputItem {
  slug: string;
}

export interface CartQuoteItem {
  materialId: string | null;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  fileType: 'PDF' | 'DOCX' | 'PPT' | 'PPTX';
  unitPriceRubles: number;
  finalPriceRubles: number;
  discountAmountRubles: number;
  available: boolean;
  reason: 'ok' | 'not_found' | 'not_store' | 'not_published';
}

export interface CartQuoteDiscount {
  code: 'subscription' | 'referral';
  label: string;
  requestedPercent: number;
  appliedPercent: number;
  amountRubles: number;
}

export interface CartQuote {
  items: CartQuoteItem[];
  subtotalRubles: number;
  totalRubles: number;
  totalDiscountRubles: number;
  totalDiscountPercent: number;
  maxDiscountPercent: number;
  discounts: CartQuoteDiscount[];
  subscriptionActive: boolean;
  referral: {
    code: string | null;
    applied: boolean;
    requestedPercent: number;
    message: string | null;
  };
  checkoutReady: boolean;
}

interface QuoteCartOptions {
  items: CartQuoteInputItem[];
  userId?: string | null;
  referralCode?: string | null;
}

function dedupeSlugs(items: CartQuoteInputItem[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const item of items) {
    const slug = item.slug.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    ordered.push(slug);
  }

  return ordered;
}

function kopecksToRubles(value: number): number {
  return Math.round(value / 100);
}

function rublesToKopecks(value: number): number {
  return Math.round(value * 100);
}

function fallbackStoreProduct(slug: string) {
  return storeProducts.find((product) => product.slug === slug);
}

async function loadStoreMaterialsBySlug(slugs: string[]): Promise<Map<string, MaterialRow>> {
  if (slugs.length === 0) return new Map();

  const result = await query<MaterialRow>(
    `
      SELECT
        m.id,
        m.slug,
        m.title,
        m.short_description,
        m.file_type,
        m.price,
        m.access_type,
        m.is_published,
        COALESCE(c.name, 'Материалы') AS category_name
      FROM materials m
      LEFT JOIN categories c ON c.id = m.category_id
      WHERE m.slug = ANY($1::text[])
    `,
    [slugs]
  );

  return new Map(result.rows.map((row) => [row.slug, row]));
}

async function hasActiveSubscription(userId: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND current_period_end > now()
    `,
    [userId]
  );

  return Number(result.rows[0]?.count ?? '0') > 0;
}

async function hasPaidOrders(userId: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM orders
      WHERE user_id = $1
        AND status = 'paid'
    `,
    [userId]
  );

  return Number(result.rows[0]?.count ?? '0') > 0;
}

async function resolveReferralDiscount(
  referralCode: string | null | undefined,
  userId: string | null | undefined
): Promise<{ code: string | null; requestedPercent: number; message: string | null }> {
  const paidOrders = userId ? await hasPaidOrders(userId) : false;
  const resolved = await resolveReferralDiscountForUser(referralCode, userId, paidOrders);

  return {
    code: resolved.code,
    requestedPercent: Math.max(0, Number(resolved.requestedPercent ?? DEFAULT_REFERRAL_DISCOUNT_PERCENT)),
    message: resolved.message,
  };
}

function buildUnavailableItem(slug: string): CartQuoteItem {
  const fallback = fallbackStoreProduct(slug);

  if (fallback) {
    return {
      materialId: null,
      slug,
      title: fallback.title,
      shortDescription: fallback.shortDescription,
      category: fallback.category,
      fileType: fallback.fileType,
      unitPriceRubles: fallback.price,
      finalPriceRubles: fallback.price,
      discountAmountRubles: 0,
      available: false,
      reason: 'not_found',
    };
  }

  return {
    materialId: null,
    slug,
    title: slug,
    shortDescription: '',
    category: 'Материалы',
    fileType: 'PDF',
    unitPriceRubles: 0,
    finalPriceRubles: 0,
    discountAmountRubles: 0,
    available: false,
    reason: 'not_found',
  };
}

export async function quoteCart(options: QuoteCartOptions): Promise<CartQuote> {
  const slugs = dedupeSlugs(options.items);
  const materialsBySlug = await loadStoreMaterialsBySlug(slugs);

  const items = slugs.map((slug) => {
    const material = materialsBySlug.get(slug);
    if (!material) {
      return buildUnavailableItem(slug);
    }

    const unitPriceRubles = kopecksToRubles(Number(material.price ?? 0));

    if (material.access_type !== 'store') {
      return {
        materialId: material.id,
        slug: material.slug,
        title: material.title,
        shortDescription: material.short_description ?? '',
        category: material.category_name,
        fileType: material.file_type,
        unitPriceRubles,
        finalPriceRubles: unitPriceRubles,
        discountAmountRubles: 0,
        available: false,
        reason: 'not_store' as const,
      };
    }

    if (!material.is_published) {
      return {
        materialId: material.id,
        slug: material.slug,
        title: material.title,
        shortDescription: material.short_description ?? '',
        category: material.category_name,
        fileType: material.file_type,
        unitPriceRubles,
        finalPriceRubles: unitPriceRubles,
        discountAmountRubles: 0,
        available: false,
        reason: 'not_published' as const,
      };
    }

    return {
      materialId: material.id,
      slug: material.slug,
      title: material.title,
      shortDescription: material.short_description ?? '',
      category: material.category_name,
      fileType: material.file_type,
      unitPriceRubles,
      finalPriceRubles: unitPriceRubles,
      discountAmountRubles: 0,
      available: true,
      reason: 'ok' as const,
    };
  });

  const availableItems = items.filter((item) => item.available);
  const subtotalRubles = availableItems.reduce((sum, item) => sum + item.unitPriceRubles, 0);

  const subscriptionActive = options.userId ? await hasActiveSubscription(options.userId) : false;
  const referral = await resolveReferralDiscount(options.referralCode, options.userId ?? null);

  let remainingPercent = MAX_CART_DISCOUNT_PERCENT;
  const discounts: Array<{
    code: 'subscription' | 'referral';
    label: string;
    requestedPercent: number;
    appliedPercent: number;
  }> = [];

  if (subscriptionActive) {
    const appliedPercent = Math.min(SUBSCRIPTION_STORE_DISCOUNT_PERCENT, remainingPercent);
    discounts.push({
      code: 'subscription',
      label: 'Скидка подписки',
      requestedPercent: SUBSCRIPTION_STORE_DISCOUNT_PERCENT,
      appliedPercent,
    });
    remainingPercent -= appliedPercent;
  }

  if (referral.requestedPercent > 0) {
    const appliedPercent = Math.min(referral.requestedPercent, remainingPercent);
    discounts.push({
      code: 'referral',
      label: `Реферальная скидка ${referral.code}`,
      requestedPercent: referral.requestedPercent,
      appliedPercent,
    });
    remainingPercent -= appliedPercent;
  }

  const totalDiscountPercent = discounts.reduce((sum, discount) => sum + discount.appliedPercent, 0);
  const totalDiscountKopecks = Math.round(rublesToKopecks(subtotalRubles) * totalDiscountPercent / 100);

  const availableItemSlugs = availableItems.map((item) => item.slug);
  let remainingDiscountKopecks = totalDiscountKopecks;
  let availableIndex = 0;
  const pricedItems = items.map((item) => {
    if (!item.available || subtotalRubles <= 0) {
      return item;
    }

    const unitPriceKopecks = rublesToKopecks(item.unitPriceRubles);
    const isLastAvailable = availableIndex === availableItemSlugs.length - 1;
    const itemDiscountKopecks = isLastAvailable
      ? remainingDiscountKopecks
      : Math.round(totalDiscountKopecks * unitPriceKopecks / rublesToKopecks(subtotalRubles));

    remainingDiscountKopecks -= itemDiscountKopecks;
    availableIndex += 1;

    return {
      ...item,
      discountAmountRubles: kopecksToRubles(itemDiscountKopecks),
      finalPriceRubles: kopecksToRubles(Math.max(0, unitPriceKopecks - itemDiscountKopecks)),
    };
  });

  const totalRubles = pricedItems
    .filter((item) => item.available)
    .reduce((sum, item) => sum + item.finalPriceRubles, 0);

  let remainingDiscountForLines = totalDiscountKopecks;
  const priceBreakdown = discounts.map((discount, index, allDiscounts) => {
    const requestedKopecks = Math.round(rublesToKopecks(subtotalRubles) * discount.appliedPercent / 100);
    const amountKopecks = index === allDiscounts.length - 1
      ? remainingDiscountForLines
      : requestedKopecks;

    remainingDiscountForLines -= amountKopecks;

    return {
      code: discount.code,
      label: discount.label,
      requestedPercent: discount.requestedPercent,
      appliedPercent: discount.appliedPercent,
      amountRubles: kopecksToRubles(amountKopecks),
    } satisfies CartQuoteDiscount;
  });

  return {
    items: pricedItems,
    subtotalRubles,
    totalRubles,
    totalDiscountRubles: subtotalRubles - totalRubles,
    totalDiscountPercent,
    maxDiscountPercent: MAX_CART_DISCOUNT_PERCENT,
    discounts: priceBreakdown,
    subscriptionActive,
    referral: {
      code: referral.code,
      applied: priceBreakdown.some((discount) => discount.code === 'referral' && discount.appliedPercent > 0),
      requestedPercent: referral.requestedPercent,
      message: referral.message,
    },
    checkoutReady: pricedItems.length > 0 && pricedItems.every((item) => item.available),
  };
}
