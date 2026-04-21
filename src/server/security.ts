import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { query } from './db';

const DEFAULT_ORIGIN_ERROR =
  'Некорректный источник запроса. Обновите страницу и попробуйте ещё раз.';
const DEFAULT_RATE_LIMIT_ERROR =
  'Слишком много запросов. Подождите немного и повторите попытку.';

let rateLimitTableReady: Promise<void> | null = null;

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function trustedOriginsFromEnv(): string[] {
  const rawValues = [
    process.env.APP_ORIGIN,
    process.env.APP_TRUSTED_ORIGINS,
  ].filter((value): value is string => Boolean(value));

  return rawValues
    .flatMap((value) => value.split(','))
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));
}

function forwardedOrigin(request: Request): string | null {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = request.headers.get('host')?.trim();
  const hostname = forwardedHost || host;

  if (!hostname) return null;

  const protocol =
    forwardedProto && /^[a-z][a-z0-9+.-]*$/i.test(forwardedProto)
      ? forwardedProto
      : 'https';

  return normalizeOrigin(`${protocol}://${hostname}`);
}

function buildTrustedOrigins(request: Request): Set<string> {
  const origins = new Set<string>();
  const requestOrigin = normalizeOrigin(request.url);
  if (requestOrigin) origins.add(requestOrigin);
  const proxyOrigin = forwardedOrigin(request);
  if (proxyOrigin) origins.add(proxyOrigin);

  for (const origin of trustedOriginsFromEnv()) {
    origins.add(origin);
  }

  return origins;
}

function getRequestSourceOrigin(request: Request): string | null {
  const originHeader = normalizeOrigin(request.headers.get('origin'));
  if (originHeader) return originHeader;

  return normalizeOrigin(request.headers.get('referer'));
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor
      .split(',')
      .map((part) => part.trim())
      .find(Boolean);

    if (first) return first.slice(0, 120);
  }

  const directHeaders = [
    'cf-connecting-ip',
    'x-real-ip',
    'fly-client-ip',
    'x-client-ip',
    'x-forwarded',
  ];

  for (const headerName of directHeaders) {
    const value = request.headers.get(headerName)?.trim();
    if (value) return value.slice(0, 120);
  }

  return 'unknown';
}

export function requireTrustedOrigin(
  request: Request,
  message = DEFAULT_ORIGIN_ERROR
): NextResponse | null {
  const sourceOrigin = getRequestSourceOrigin(request);
  const trustedOrigins = buildTrustedOrigins(request);

  if (!sourceOrigin || !trustedOrigins.has(sourceOrigin)) {
    return NextResponse.json(
      {
        error: 'origin_forbidden',
        message,
      },
      { status: 403 }
    );
  }

  return null;
}

async function ensureRateLimitTable(): Promise<void> {
  if (!rateLimitTableReady) {
    rateLimitTableReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS request_rate_limits (
          bucket_key text PRIMARY KEY,
          count integer NOT NULL DEFAULT 0,
          reset_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS request_rate_limits_reset_at_idx
        ON request_rate_limits (reset_at)
      `);
    })().catch((err) => {
      rateLimitTableReady = null;
      throw err;
    });
  }

  await rateLimitTableReady;
}

function hashKey(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase();
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

interface ConsumeRateLimitOptions {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}

export async function consumeRateLimit(
  options: ConsumeRateLimitOptions
): Promise<RateLimitResult> {
  await ensureRateLimitTable();

  const bucketKey = hashKey(
    `${options.scope}:${options.windowSeconds}:${normalizeKeyPart(options.identifier)}`
  );

  const result = await query<{
    count: number | string;
    retry_after_seconds: number | string;
  }>(
    `
      INSERT INTO request_rate_limits (bucket_key, count, reset_at, updated_at)
      VALUES ($1, 1, now() + make_interval(secs => $2), now())
      ON CONFLICT (bucket_key)
      DO UPDATE SET
        count = CASE
          WHEN request_rate_limits.reset_at <= now() THEN 1
          ELSE request_rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN request_rate_limits.reset_at <= now() THEN now() + make_interval(secs => $2)
          ELSE request_rate_limits.reset_at
        END,
        updated_at = now()
      RETURNING
        count,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (reset_at - now()))))::int AS retry_after_seconds
    `,
    [bucketKey, options.windowSeconds]
  );

  const row = result.rows[0];
  const count = Number(row?.count ?? 0);
  const retryAfterSeconds = Number(row?.retry_after_seconds ?? options.windowSeconds);
  const allowed = count <= options.limit;

  if (Math.random() < 0.02) {
    void query(
      `
        DELETE FROM request_rate_limits
        WHERE reset_at < now() - interval '1 day'
      `
    ).catch(() => {});
  }

  return {
    allowed,
    count,
    limit: options.limit,
    remaining: Math.max(0, options.limit - count),
    retryAfterSeconds,
  };
}

interface ConsumeRequestRateLimitOptions {
  scope: string;
  limit: number;
  windowSeconds: number;
  keyParts?: Array<string | null | undefined>;
  includeIp?: boolean;
}

export async function consumeRequestRateLimit(
  request: Request,
  options: ConsumeRequestRateLimitOptions
): Promise<RateLimitResult> {
  const parts: string[] = [];

  if (options.includeIp !== false) {
    parts.push(`ip:${getClientIp(request)}`);
  }

  for (const part of options.keyParts ?? []) {
    if (typeof part === 'string' && part.trim()) {
      parts.push(normalizeKeyPart(part));
    }
  }

  return consumeRateLimit({
    scope: options.scope,
    identifier: parts.join('|') || 'global',
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  });
}

export function rateLimitResponse(
  result: RateLimitResult,
  message = DEFAULT_RATE_LIMIT_ERROR
): NextResponse {
  return NextResponse.json(
    {
      error: 'rate_limited',
      message,
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  );
}
