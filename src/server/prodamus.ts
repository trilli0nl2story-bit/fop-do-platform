import { createHmac, timingSafeEqual } from 'node:crypto';

export interface ProdamusConfig {
  payformUrl: string;
  secretKey: string;
}

export interface ProdamusProduct {
  name: string;
  price: string | number;
  quantity: string | number;
  sku?: string;
}

export interface ProdamusPaymentPayload {
  order_id: string;
  customer_email?: string;
  customer_phone?: string;
  customer_extra?: string;
  products: ProdamusProduct[];
  urlReturn: string;
  urlSuccess: string;
  urlNotification: string;
  callbackType?: 'json';
  sys?: string;
  do?: 'pay';
  payment_comment?: string;
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, sortValue(nestedValue)]);

    return Object.fromEntries(entries);
  }

  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (value === null) return '';

  return typeof value === 'string' ? value : String(value ?? '');
}

function buildSignatureBase(data: Record<string, unknown>): string {
  const prepared = sortValue(data);
  return JSON.stringify(prepared).replace(/\//g, '\\/');
}

function appendQueryEntry(
  segments: string[],
  value: unknown,
  pairs: string[][]
): void {
  if (value === undefined) return;

  if (Array.isArray(value)) {
    value.forEach((nestedValue, index) => appendQueryEntry([...segments, String(index)], nestedValue, pairs));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      appendQueryEntry([...segments, key], nestedValue, pairs);
    });
    return;
  }

  const [first, ...rest] = segments;
  const queryKey = first + rest.map((segment) => `[${segment}]`).join('');
  const queryValue =
    typeof value === 'boolean'
      ? value ? 'true' : 'false'
      : typeof value === 'number'
        ? String(value)
        : value === null
          ? ''
          : String(value);

  pairs.push([queryKey, queryValue]);
}

function toUrlSearchParams(data: Record<string, unknown>): URLSearchParams {
  const pairs: string[][] = [];

  Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .forEach(([key, value]) => appendQueryEntry([key], value, pairs));

  const params = new URLSearchParams();
  pairs.forEach(([key, value]) => params.append(key, value));
  return params;
}

export function isProdamusConfigured(): boolean {
  return Boolean(process.env.PRODAMUS_PAYFORM_URL?.trim() && process.env.PRODAMUS_SECRET_KEY?.trim());
}

export function getProdamusConfig(): ProdamusConfig {
  const payformUrl = process.env.PRODAMUS_PAYFORM_URL?.trim();
  const secretKey = process.env.PRODAMUS_SECRET_KEY?.trim();

  if (!payformUrl || !secretKey) {
    throw new Error('Prodamus is not configured. Add PRODAMUS_PAYFORM_URL and PRODAMUS_SECRET_KEY.');
  }

  return {
    payformUrl: normalizeUrl(payformUrl),
    secretKey,
  };
}

export function createProdamusSignature(
  data: Record<string, unknown>,
  secretKey: string
): string {
  const base = buildSignatureBase(data);
  return createHmac('sha256', secretKey).update(base).digest('hex');
}

export function verifyProdamusSignature(
  data: Record<string, unknown>,
  secretKey: string,
  signature: string
): boolean {
  const actual = createProdamusSignature(data, secretKey);
  const left = Buffer.from(actual);
  const right = Buffer.from(signature.trim().toLowerCase());

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function buildProdamusPayformUrl(payload: ProdamusPaymentPayload): string {
  const { payformUrl, secretKey } = getProdamusConfig();
  const preparedPayload: Record<string, unknown> = {
    ...payload,
    callbackType: payload.callbackType ?? 'json',
    do: payload.do ?? 'pay',
    sys: payload.sys ?? '',
  };

  const signature = createProdamusSignature(preparedPayload, secretKey);
  const params = toUrlSearchParams({
    ...preparedPayload,
    signature,
  });

  return `${payformUrl}?${params.toString()}`;
}
