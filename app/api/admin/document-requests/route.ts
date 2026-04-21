import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

type DocumentRequestStatus =
  | 'received'
  | 'in_progress'
  | 'draft_generated'
  | 'under_review'
  | 'completed'
  | 'rejected';

const DOCUMENT_REQUEST_STATUSES = new Set<DocumentRequestStatus>([
  'received',
  'in_progress',
  'draft_generated',
  'under_review',
  'completed',
  'rejected',
]);

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { error: null };
}

function parseDescription(value: string): { topic: string; details: string } {
  const normalized = value.trim();
  const match = normalized.match(/^Тема:\s*(.+?)(?:\r?\n\r?\n|\r?\n)([\s\S]*)$/i);
  if (!match) {
    return { topic: '', details: normalized };
  }

  return {
    topic: match[1].trim(),
    details: match[2].trim(),
  };
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? '';

    if (status && !DOCUMENT_REQUEST_STATUSES.has(status as DocumentRequestStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await query<{
      id: string;
      user_id: string | null;
      account_email: string | null;
      email: string;
      name: string;
      description: string;
      age_group: string;
      document_type: string;
      status: string;
      result_file_url: string | null;
      admin_note: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT
          dr.id,
          dr.user_id,
          u.email AS account_email,
          dr.email,
          dr.name,
          dr.description,
          dr.age_group,
          dr.document_type,
          dr.status,
          dr.result_file_url,
          dr.admin_note,
          dr.created_at,
          dr.updated_at
        FROM document_requests dr
        LEFT JOIN users u ON u.id = dr.user_id
        WHERE (
          $1 = ''
          OR dr.email ILIKE $2
          OR dr.name ILIKE $2
          OR dr.document_type ILIKE $2
          OR dr.description ILIKE $2
          OR COALESCE(u.email, '') ILIKE $2
        )
          AND ($3 = '' OR dr.status = $3)
        ORDER BY dr.created_at DESC
        LIMIT 100
      `,
      [search, `%${search}%`, status]
    );

    return NextResponse.json({
      items: result.rows.map((row) => {
        const parsed = parseDescription(row.description);
        return {
          id: row.id,
          userId: row.user_id,
          accountEmail: row.account_email,
          email: row.email,
          name: row.name,
          topic: parsed.topic,
          details: parsed.details,
          ageGroup: row.age_group,
          documentType: row.document_type,
          status: row.status,
          resultFileUrl: row.result_file_url ?? '',
          adminNote: row.admin_note ?? '',
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        };
      }),
    });
  } catch (err) {
    console.error('[api/admin/document-requests]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
