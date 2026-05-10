import type { PoolClient } from 'pg';
import { query, withTransaction } from './db';
import { getClientIp } from './security';
import { getLegalDocument, type LegalDocumentSlug } from '../config/legalDocuments';

export type ConsentType =
  | 'personal_data'
  | 'terms'
  | 'offer'
  | 'refund'
  | 'subscription'
  | 'marketing'
  | 'cookies_analytics'
  | 'cookies_ads'
  | 'ai_rules'
  | 'review_publication'
  | 'author_agreement';

interface RecordConsentParams {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  formName: string;
  consentType: ConsentType;
  documentSlug: LegalDocumentSlug;
  sourceUrl?: string | null;
  metadata?: Record<string, unknown>;
}

interface StoreCheckoutConsentParams {
  userId: string;
  email?: string | null;
  sourceUrl?: string | null;
  metadata: Record<string, unknown> & {
    orderId: string;
    paymentId: string;
    totalRubles: number;
  };
}

interface SubscriptionCheckoutConsentParams {
  userId: string;
  email?: string | null;
  sourceUrl?: string | null;
  metadata: Record<string, unknown> & {
    orderId: string;
    paymentId: string;
    totalRubles: number;
    planId: string;
  };
}

let consentsTableReady: Promise<void> | null = null;

export async function ensureConsentsTable(): Promise<void> {
  if (!consentsTableReady) {
    consentsTableReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS consents (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
          email text NULL,
          phone text NULL,
          form_name text NOT NULL,
          consent_type text NOT NULL,
          document_slug text NOT NULL,
          document_version text NOT NULL,
          document_hash text NULL,
          accepted_at timestamptz NOT NULL DEFAULT now(),
          ip_address text NULL,
          user_agent text NULL,
          source_url text NULL,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        )
      `);

      await query('CREATE INDEX IF NOT EXISTS consents_user_id_idx ON consents (user_id)');
      await query('CREATE INDEX IF NOT EXISTS consents_email_idx ON consents (email)');
      await query('CREATE INDEX IF NOT EXISTS consents_type_idx ON consents (consent_type)');
      await query('CREATE INDEX IF NOT EXISTS consents_accepted_at_idx ON consents (accepted_at DESC)');
    })().catch((error) => {
      consentsTableReady = null;
      throw error;
    });
  }

  await consentsTableReady;
}

function truncate(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function sourceUrlFromRequest(request: Request): string {
  return request.headers.get('referer') ?? request.url;
}

export async function recordConsent(
  params: RecordConsentParams,
  request: Request,
  client?: PoolClient
): Promise<void> {
  const document = getLegalDocument(params.documentSlug);
  const sql = `
    INSERT INTO consents (
      user_id,
      email,
      phone,
      form_name,
      consent_type,
      document_slug,
      document_version,
      document_hash,
      ip_address,
      user_agent,
      source_url,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
  `;
  const values = [
    params.userId ?? null,
    truncate(params.email, 320),
    truncate(params.phone, 80),
    truncate(params.formName, 120),
    params.consentType,
    document.slug,
    document.version,
    document.documentHash,
    truncate(getClientIp(request), 120),
    truncate(request.headers.get('user-agent'), 500),
    truncate(params.sourceUrl ?? sourceUrlFromRequest(request), 1000),
    JSON.stringify(params.metadata ?? {}),
  ];

  if (client) {
    await client.query(sql, values);
    return;
  }

  await query(sql, values);
}

export async function recordStoreCheckoutConsents(
  params: StoreCheckoutConsentParams,
  request: Request
): Promise<void> {
  await ensureConsentsTable();

  await withTransaction(async (client) => {
    await recordConsent(
      {
        userId: params.userId,
        email: params.email,
        formName: 'store_checkout',
        consentType: 'offer',
        documentSlug: 'offer',
        sourceUrl: params.sourceUrl,
        metadata: params.metadata,
      },
      request,
      client
    );

    await recordConsent(
      {
        userId: params.userId,
        email: params.email,
        formName: 'store_checkout',
        consentType: 'refund',
        documentSlug: 'refund',
        sourceUrl: params.sourceUrl,
        metadata: params.metadata,
      },
      request,
      client
    );
  });
}

type ConsentTypeRow = {
  consent_type: ConsentType;
};

export async function hasStoreCheckoutConsents(params: {
  userId: string;
  orderId: string;
  client?: PoolClient;
}): Promise<boolean> {
  await ensureConsentsTable();

  const sql = `
    SELECT DISTINCT consent_type
    FROM consents
    WHERE user_id = $1
      AND form_name = 'store_checkout'
      AND metadata->>'orderId' = $2
      AND (
        (consent_type = 'offer' AND document_slug = 'offer')
        OR (consent_type = 'refund' AND document_slug = 'refund')
      )
  `;
  const values = [params.userId, params.orderId];
  const result = params.client
    ? await params.client.query<ConsentTypeRow>(sql, values)
    : await query<ConsentTypeRow>(sql, values);
  const types = new Set(result.rows.map((row) => row.consent_type));

  return types.has('offer') && types.has('refund');
}

export async function recordSubscriptionCheckoutConsents(
  params: SubscriptionCheckoutConsentParams,
  request: Request
): Promise<void> {
  await ensureConsentsTable();

  await withTransaction(async (client) => {
    for (const consent of [
      { consentType: 'offer' as const, documentSlug: 'offer' as const },
      { consentType: 'subscription' as const, documentSlug: 'subscription' as const },
      { consentType: 'refund' as const, documentSlug: 'refund' as const },
    ]) {
      await recordConsent(
        {
          userId: params.userId,
          email: params.email,
          formName: 'subscription_checkout',
          consentType: consent.consentType,
          documentSlug: consent.documentSlug,
          sourceUrl: params.sourceUrl,
          metadata: params.metadata,
        },
        request,
        client
      );
    }
  });
}

export async function hasSubscriptionCheckoutConsents(params: {
  userId: string;
  orderId: string;
  client?: PoolClient;
}): Promise<boolean> {
  await ensureConsentsTable();

  const sql = `
    SELECT DISTINCT consent_type
    FROM consents
    WHERE user_id = $1
      AND form_name = 'subscription_checkout'
      AND metadata->>'orderId' = $2
      AND (
        (consent_type = 'offer' AND document_slug = 'offer')
        OR (consent_type = 'subscription' AND document_slug = 'subscription')
        OR (consent_type = 'refund' AND document_slug = 'refund')
      )
  `;
  const values = [params.userId, params.orderId];
  const result = params.client
    ? await params.client.query<ConsentTypeRow>(sql, values)
    : await query<ConsentTypeRow>(sql, values);
  const types = new Set(result.rows.map((row) => row.consent_type));

  return types.has('offer') && types.has('subscription') && types.has('refund');
}
