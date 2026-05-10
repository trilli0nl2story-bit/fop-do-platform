import { query } from './db';
import { ensureConsentsTable, recordConsent } from './consents';
import type { PoolClient } from 'pg';

export interface ConsentMeta {
  acceptedAt: string;
  ip: string | null;
  userAgent: string | null;
}

const consentReady = new Map<string, Promise<void>>();

export function getRequestIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 200);
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 200);

  return null;
}

export function getRequestUserAgent(request: Request): string | null {
  const value = request.headers.get('user-agent')?.trim();
  return value ? value.slice(0, 1000) : null;
}

export function buildConsentMeta(request: Request): ConsentMeta {
  return {
    acceptedAt: new Date().toISOString(),
    ip: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
  };
}

export async function ensureConsentColumns(tableName: string): Promise<void> {
  const existing = consentReady.get(tableName);
  if (existing) {
    await existing;
    return;
  }

  const task = (async () => {
    await query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS consent_accepted_at timestamptz`);
    await query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS consent_ip text`);
    await query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS consent_user_agent text`);
  })().catch((error) => {
    consentReady.delete(tableName);
    throw error;
  });

  consentReady.set(tableName, task);
  await task;
}

export async function recordPublicFormPersonalDataConsent(
  params: {
    userId?: string | null;
    email?: string | null;
    phone?: string | null;
    formName: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
  request: Request,
  client?: PoolClient
): Promise<void> {
  await ensureConsentsTable();
  await recordConsent(
    {
      userId: params.userId ?? null,
      email: params.email ?? null,
      phone: params.phone ?? null,
      formName: params.formName,
      consentType: 'personal_data',
      documentSlug: 'personal-data-consent',
      metadata: {
        formVersion: 'public-form-2026-05',
        entityId: params.entityId,
        linkedDocumentSlugs: ['privacy-policy'],
        ...(params.metadata ?? {}),
      },
    },
    request,
    client
  );
}
