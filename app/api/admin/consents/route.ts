import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import { ensureConsentsTable } from '@/src/server/consents';

export const dynamic = 'force-dynamic';

type ConsentRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  form_name: string;
  consent_type: string;
  document_slug: string;
  document_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  source_url: string | null;
  metadata: Record<string, unknown> | null;
};

type SummaryRow = {
  total: string;
  last_24h: string;
  checkout: string;
  ai_rules: string;
  marketing: string;
};

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { error: null };
}

function appendCondition(
  conditions: string[],
  params: unknown[],
  sql: string,
  value: unknown
) {
  params.push(value);
  conditions.push(sql.replaceAll('$?', `$${params.length}`));
}

function csvCell(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'string'
        ? value
        : JSON.stringify(value);
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function buildCsv(rows: ConsentRow[]): string {
  const header = [
    'id',
    'accepted_at',
    'user_id',
    'email',
    'phone',
    'form_name',
    'consent_type',
    'document_slug',
    'document_version',
    'source_url',
    'ip_address',
    'user_agent',
    'metadata',
  ];

  const lines = rows.map((row) => [
    row.id,
    row.accepted_at,
    row.user_id,
    row.email,
    row.phone,
    row.form_name,
    row.consent_type,
    row.document_slug,
    row.document_version,
    row.source_url,
    row.ip_address,
    row.user_agent,
    row.metadata ?? {},
  ].map(csvCell).join(','));

  return ['\uFEFF' + header.join(','), ...lines].join('\n');
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await ensureConsentsTable();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const consentType = searchParams.get('type')?.trim() ?? '';
    const formName = searchParams.get('form')?.trim() ?? '';
    const exportCsv = searchParams.get('export') === 'csv';

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      appendCondition(
        conditions,
        params,
        `(COALESCE(email, '') ILIKE $? OR COALESCE(phone, '') ILIKE $? OR COALESCE(user_id::text, '') ILIKE $? OR id::text ILIKE $?)`,
        `%${search}%`
      );
    }

    if (consentType) {
      appendCondition(conditions, params, 'consent_type = $?', consentType);
    }

    if (formName) {
      appendCondition(conditions, params, 'form_name = $?', formName);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = exportCsv ? 1000 : 100;

    const [summaryRes, itemsRes] = await Promise.all([
      query<SummaryRow>(
        `
          SELECT
            COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE accepted_at >= now() - interval '24 hours')::text AS last_24h,
            COUNT(*) FILTER (WHERE form_name IN ('store_checkout', 'subscription_checkout'))::text AS checkout,
            COUNT(*) FILTER (WHERE consent_type = 'ai_rules')::text AS ai_rules,
            COUNT(*) FILTER (WHERE consent_type = 'marketing')::text AS marketing
          FROM consents
          ${whereSql}
        `,
        params
      ),
      query<ConsentRow>(
        `
          SELECT
            id,
            user_id,
            email,
            phone,
            form_name,
            consent_type,
            document_slug,
            document_version,
            accepted_at,
            ip_address,
            user_agent,
            source_url,
            metadata
          FROM consents
          ${whereSql}
          ORDER BY accepted_at DESC
          LIMIT ${limit}
        `,
        params
      ),
    ]);

    if (exportCsv) {
      return new NextResponse(buildCsv(itemsRes.rows), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="dnl-consents.csv"',
          'Cache-Control': 'no-store',
        },
      });
    }

    const summary = summaryRes.rows[0];

    return NextResponse.json({
      summary: {
        total: Number(summary?.total ?? '0'),
        last24h: Number(summary?.last_24h ?? '0'),
        checkout: Number(summary?.checkout ?? '0'),
        aiRules: Number(summary?.ai_rules ?? '0'),
        marketing: Number(summary?.marketing ?? '0'),
      },
      items: itemsRes.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        email: row.email,
        phone: row.phone,
        formName: row.form_name,
        consentType: row.consent_type,
        documentSlug: row.document_slug,
        documentVersion: row.document_version,
        acceptedAt: new Date(row.accepted_at).toISOString(),
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        sourceUrl: row.source_url,
        metadata: row.metadata ?? {},
      })),
    });
  } catch (error) {
    console.error('[api/admin/consents]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
