import type { PoolClient } from 'pg';
import { query, withTransaction } from './db';
import { getClientIp } from './security';

export type PrivacyRequestType = 'data_export' | 'account_deletion' | 'consent_withdrawal';
export type PrivacyRequestStatus = 'new' | 'in_progress' | 'completed' | 'rejected';

export interface AccountPrivacySettings {
  marketingOptIn: boolean;
  marketingUpdatedAt: string | null;
}

export interface AccountPrivacyRequest {
  id: string;
  requestType: PrivacyRequestType;
  status: PrivacyRequestStatus;
  createdAt: string;
}

export interface AdminAccountPrivacyRequest extends AccountPrivacyRequest {
  userId: string;
  email: string;
  name: string;
  lastName: string;
  role: string;
  city: string;
  updatedAt: string;
  resolvedAt: string | null;
  adminNote: string;
  metadata: Record<string, unknown>;
}

export interface AdminAccountPrivacySummary {
  total: number;
  new: number;
  inProgress: number;
  completed: number;
  rejected: number;
}

let accountPrivacyReady: Promise<void> | null = null;

export async function ensureAccountPrivacyTables(): Promise<void> {
  if (!accountPrivacyReady) {
    accountPrivacyReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS account_privacy_settings (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          marketing_opt_in boolean NOT NULL DEFAULT false,
          marketing_updated_at timestamptz NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS account_privacy_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          request_type text NOT NULL CHECK (request_type IN ('data_export', 'account_deletion', 'consent_withdrawal')),
          status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'rejected')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          resolved_at timestamptz NULL,
          resolved_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
          admin_note text NOT NULL DEFAULT '',
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        )
      `);

      await query('ALTER TABLE account_privacy_requests ADD COLUMN IF NOT EXISTS resolved_by uuid NULL REFERENCES users(id) ON DELETE SET NULL');
      await query("ALTER TABLE account_privacy_requests ADD COLUMN IF NOT EXISTS admin_note text NOT NULL DEFAULT ''");
      await query('CREATE INDEX IF NOT EXISTS account_privacy_requests_user_idx ON account_privacy_requests (user_id, created_at DESC)');
      await query('CREATE INDEX IF NOT EXISTS account_privacy_requests_status_idx ON account_privacy_requests (status, created_at DESC)');
      await query(`
        WITH ranked AS (
          SELECT
            id,
            row_number() OVER (
              PARTITION BY user_id, request_type
              ORDER BY created_at DESC, id DESC
            ) AS row_num
          FROM account_privacy_requests
          WHERE status IN ('new', 'in_progress')
        )
        UPDATE account_privacy_requests
        SET
          status = 'rejected',
          updated_at = now(),
          metadata = metadata || '{"autoClosedDuplicate": true}'::jsonb
        WHERE id IN (SELECT id FROM ranked WHERE row_num > 1)
      `);
      await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS account_privacy_requests_pending_unique
        ON account_privacy_requests (user_id, request_type)
        WHERE status IN ('new', 'in_progress')
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS account_privacy_events (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_type text NOT NULL,
          request_type text NULL,
          ip_address text NULL,
          user_agent text NULL,
          source_url text NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        )
      `);

      await query('CREATE INDEX IF NOT EXISTS account_privacy_events_user_idx ON account_privacy_events (user_id, created_at DESC)');
    })().catch((error) => {
      accountPrivacyReady = null;
      throw error;
    });
  }

  await accountPrivacyReady;
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

async function logPrivacyEvent(
  params: {
    userId: string;
    eventType: string;
    requestType?: PrivacyRequestType | null;
    metadata?: Record<string, unknown>;
  },
  request: Request,
  client?: PoolClient
): Promise<void> {
  const sql = `
    INSERT INTO account_privacy_events (
      user_id,
      event_type,
      request_type,
      ip_address,
      user_agent,
      source_url,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
  `;
  const values = [
    params.userId,
    truncate(params.eventType, 120),
    params.requestType ?? null,
    truncate(getClientIp(request), 120),
    truncate(request.headers.get('user-agent'), 500),
    truncate(sourceUrlFromRequest(request), 1000),
    JSON.stringify(params.metadata ?? {}),
  ];

  if (client) {
    await client.query(sql, values);
    return;
  }

  await query(sql, values);
}

export async function saveMarketingPreference(
  params: {
    userId: string;
    marketingOptIn: boolean;
    source: 'registration' | 'profile';
  },
  request: Request,
  client?: PoolClient
): Promise<void> {
  const sql = `
    INSERT INTO account_privacy_settings (
      user_id,
      marketing_opt_in,
      marketing_updated_at,
      updated_at
    )
    VALUES ($1, $2, now(), now())
    ON CONFLICT (user_id)
    DO UPDATE SET
      marketing_opt_in = EXCLUDED.marketing_opt_in,
      marketing_updated_at = now(),
      updated_at = now()
  `;

  const values = [params.userId, params.marketingOptIn];
  if (client) {
    await client.query(sql, values);
  } else {
    await query(sql, values);
  }

  await logPrivacyEvent(
    {
      userId: params.userId,
      eventType: params.marketingOptIn ? 'marketing_opt_in' : 'marketing_opt_out',
      metadata: { source: params.source },
    },
    request,
    client
  );
}

export async function getAccountPrivacySettings(userId: string): Promise<AccountPrivacySettings> {
  await ensureAccountPrivacyTables();

  const settings = await query<{
    marketing_opt_in: boolean;
    marketing_updated_at: string | null;
  }>(
    `
      SELECT marketing_opt_in, marketing_updated_at
      FROM account_privacy_settings
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = settings.rows[0];
  if (row) {
    return {
      marketingOptIn: row.marketing_opt_in === true,
      marketingUpdatedAt: row.marketing_updated_at ? new Date(row.marketing_updated_at).toISOString() : null,
    };
  }

  const latestMarketingConsent = await query<{ accepted_at: string }>(
    `
      SELECT accepted_at
      FROM consents
      WHERE user_id = $1
        AND consent_type = 'marketing'
        AND document_slug = 'marketing-consent'
      ORDER BY accepted_at DESC
      LIMIT 1
    `,
    [userId]
  ).catch(() => ({ rows: [], rowCount: 0 }));

  const latest = latestMarketingConsent.rows[0]?.accepted_at ?? null;
  return {
    marketingOptIn: Boolean(latest),
    marketingUpdatedAt: latest ? new Date(latest).toISOString() : null,
  };
}

export async function listAccountPrivacyRequests(userId: string): Promise<AccountPrivacyRequest[]> {
  await ensureAccountPrivacyTables();

  const result = await query<{
    id: string;
    request_type: PrivacyRequestType;
    status: AccountPrivacyRequest['status'];
    created_at: string;
  }>(
    `
      SELECT id, request_type, status, created_at
      FROM account_privacy_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    requestType: row.request_type,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

function toAdminPrivacyRequest(row: {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  last_name: string | null;
  role: string | null;
  city: string | null;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  admin_note: string | null;
  metadata: Record<string, unknown> | null;
}): AdminAccountPrivacyRequest {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name ?? '',
    lastName: row.last_name ?? '',
    role: row.role ?? '',
    city: row.city ?? '',
    requestType: row.request_type,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    adminNote: row.admin_note ?? '',
    metadata: row.metadata ?? {},
  };
}

export async function listAdminAccountPrivacyRequests(params: {
  search?: string;
  status?: PrivacyRequestStatus | '';
  requestType?: PrivacyRequestType | '';
}): Promise<{ summary: AdminAccountPrivacySummary; items: AdminAccountPrivacyRequest[] }> {
  await ensureAccountPrivacyTables();

  const search = params.search?.trim() ?? '';
  const status = params.status ?? '';
  const requestType = params.requestType ?? '';
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    const index = values.length;
    conditions.push(`(
      u.email ILIKE $${index}
      OR COALESCE(p.name, '') ILIKE $${index}
      OR COALESCE(p.last_name, '') ILIKE $${index}
      OR COALESCE(p.city, '') ILIKE $${index}
      OR apr.id::text ILIKE $${index}
    )`);
  }

  if (status) {
    values.push(status);
    conditions.push(`apr.status = $${values.length}`);
  }

  if (requestType) {
    values.push(requestType);
    conditions.push(`apr.request_type = $${values.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [summaryResult, itemsResult] = await Promise.all([
    query<{
      total: string;
      new_count: string;
      in_progress_count: string;
      completed_count: string;
      rejected_count: string;
    }>(`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'new')::text AS new_count,
        COUNT(*) FILTER (WHERE status = 'in_progress')::text AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'completed')::text AS completed_count,
        COUNT(*) FILTER (WHERE status = 'rejected')::text AS rejected_count
      FROM account_privacy_requests
    `),
    query<{
      id: string;
      user_id: string;
      email: string;
      name: string | null;
      last_name: string | null;
      role: string | null;
      city: string | null;
      request_type: PrivacyRequestType;
      status: PrivacyRequestStatus;
      created_at: string;
      updated_at: string;
      resolved_at: string | null;
      admin_note: string | null;
      metadata: Record<string, unknown> | null;
    }>(
      `
        SELECT
          apr.id,
          apr.user_id,
          u.email,
          p.name,
          p.last_name,
          p.role,
          p.city,
          apr.request_type,
          apr.status,
          apr.created_at,
          apr.updated_at,
          apr.resolved_at,
          apr.admin_note,
          apr.metadata
        FROM account_privacy_requests apr
        JOIN users u ON u.id = apr.user_id
        LEFT JOIN user_profiles p ON p.id = apr.user_id
        ${whereSql}
        ORDER BY
          CASE apr.status
            WHEN 'new' THEN 0
            WHEN 'in_progress' THEN 1
            WHEN 'completed' THEN 2
            ELSE 3
          END,
          apr.created_at DESC
        LIMIT 100
      `,
      values
    ),
  ]);

  const summary = summaryResult.rows[0];

  return {
    summary: {
      total: Number(summary?.total ?? '0'),
      new: Number(summary?.new_count ?? '0'),
      inProgress: Number(summary?.in_progress_count ?? '0'),
      completed: Number(summary?.completed_count ?? '0'),
      rejected: Number(summary?.rejected_count ?? '0'),
    },
    items: itemsResult.rows.map(toAdminPrivacyRequest),
  };
}

export async function updateAdminAccountPrivacyRequest(
  params: {
    requestId: string;
    adminUserId: string;
    status: PrivacyRequestStatus;
    adminNote?: string;
  },
  request: Request
): Promise<AdminAccountPrivacyRequest | null> {
  await ensureAccountPrivacyTables();

  return withTransaction(async (client) => {
    const current = await client.query<{
      id: string;
      user_id: string;
      request_type: PrivacyRequestType;
      status: PrivacyRequestStatus;
      admin_note: string | null;
    }>(
      `
        SELECT id, user_id, request_type, status, admin_note
        FROM account_privacy_requests
        WHERE id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [params.requestId]
    );

    const before = current.rows[0];
    if (!before) return null;

    const nextAdminNote =
      params.adminNote === undefined
        ? before.admin_note ?? ''
        : params.adminNote.trim().slice(0, 5000);
    const resolvedAtExpression = params.status === 'completed' || params.status === 'rejected' ? 'now()' : 'NULL';

    const updated = await client.query<{
      id: string;
      user_id: string;
      email: string;
      name: string | null;
      last_name: string | null;
      role: string | null;
      city: string | null;
      request_type: PrivacyRequestType;
      status: PrivacyRequestStatus;
      created_at: string;
      updated_at: string;
      resolved_at: string | null;
      admin_note: string | null;
      metadata: Record<string, unknown> | null;
    }>(
      `
        UPDATE account_privacy_requests apr
        SET
          status = $2,
          admin_note = $3,
          resolved_at = ${resolvedAtExpression},
          resolved_by = CASE WHEN $2 IN ('completed', 'rejected') THEN $4::uuid ELSE NULL END,
          updated_at = now()
        FROM users u
        LEFT JOIN user_profiles p ON p.id = u.id
        WHERE apr.id = $1
          AND u.id = apr.user_id
        RETURNING
          apr.id,
          apr.user_id,
          u.email,
          p.name,
          p.last_name,
          p.role,
          p.city,
          apr.request_type,
          apr.status,
          apr.created_at,
          apr.updated_at,
          apr.resolved_at,
          apr.admin_note,
          apr.metadata
      `,
      [params.requestId, params.status, nextAdminNote, params.adminUserId]
    );

    const row = updated.rows[0];
    if (!row) return null;

    await logPrivacyEvent(
      {
        userId: row.user_id,
        eventType: 'privacy_request_admin_update',
        requestType: row.request_type,
        metadata: {
          requestId: row.id,
          adminUserId: params.adminUserId,
          previousStatus: before.status,
          nextStatus: row.status,
          previousAdminNoteLength: before.admin_note?.length ?? 0,
          nextAdminNoteLength: row.admin_note?.length ?? 0,
        },
      },
      request,
      client
    );

    await client.query(
      `
        INSERT INTO admin_audit_log (
          admin_id,
          action,
          target_type,
          target_id,
          before_data,
          after_data,
          created_at
        )
        VALUES ($1, 'account_privacy_request.update', 'account_privacy_request', $2, $3::jsonb, $4::jsonb, now())
      `,
      [
        params.adminUserId,
        row.id,
        JSON.stringify({
          status: before.status,
          adminNoteLength: before.admin_note?.length ?? 0,
        }),
        JSON.stringify({
          status: row.status,
          adminNoteLength: row.admin_note?.length ?? 0,
          adminNoteChanged: (before.admin_note ?? '') !== (row.admin_note ?? ''),
        }),
      ]
    );

    return toAdminPrivacyRequest(row);
  });
}

export async function createAccountPrivacyRequest(
  params: {
    userId: string;
    requestType: PrivacyRequestType;
  },
  request: Request
): Promise<AccountPrivacyRequest> {
  await ensureAccountPrivacyTables();

  const created = await query<{
    id: string;
    request_type: PrivacyRequestType;
    status: AccountPrivacyRequest['status'];
    created_at: string;
    inserted: boolean;
  }>(
    `
      INSERT INTO account_privacy_requests (user_id, request_type, status, metadata)
      VALUES ($1, $2, 'new', '{}'::jsonb)
      ON CONFLICT (user_id, request_type) WHERE status IN ('new', 'in_progress')
      DO UPDATE SET updated_at = account_privacy_requests.updated_at
      RETURNING id, request_type, status, created_at, (xmax = 0) AS inserted
    `,
    [params.userId, params.requestType]
  );

  const row = created.rows[0];
  if (row.inserted === true) {
    await logPrivacyEvent(
      {
        userId: params.userId,
        eventType: 'privacy_request_created',
        requestType: params.requestType,
      },
      request
    );
  }

  return {
    id: row.id,
    requestType: row.request_type,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
