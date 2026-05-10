import type { PoolClient } from 'pg';
import type { NextRequest } from 'next/server';
import { query } from './db';
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

function sourceUrlFromRequest(request: NextRequest): string {
  return request.headers.get('referer') ?? request.url;
}

export async function recordConsent(
  params: RecordConsentParams,
  request: NextRequest,
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
