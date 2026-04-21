import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

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

interface Params {
  params: Promise<{ requestId: string }>;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}

function cleanUrl(value: unknown, maxLength = 1000): string | null {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, maxLength);
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

function publicRequest(row: {
  id: string;
  email: string;
  name: string;
  description: string;
  age_group: string;
  document_type: string;
  status: string;
  result_file_url: string | null;
  admin_note: string | null;
  updated_at: string;
}) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    description: row.description,
    ageGroup: row.age_group,
    documentType: row.document_type,
    status: row.status,
    resultFileUrl: row.result_file_url ?? '',
    adminNote: row.admin_note ?? '',
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const rate = await consumeRequestRateLimit(request, {
      scope: 'admin-document-requests-write',
      limit: 40,
      windowSeconds: 5 * 60,
      keyParts: [user!.id],
    });
    if (!rate.allowed) {
      return rateLimitResponse(
        rate,
        'Слишком много изменений заявок за короткое время. Подождите немного и попробуйте ещё раз.'
      );
    }

    const { requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const status = cleanText(body.status, 40);
    const adminNote = cleanText(body.adminNote, 5000);
    const resultFileUrl = cleanUrl(body.resultFileUrl);

    if (!status || !DOCUMENT_REQUEST_STATUSES.has(status as DocumentRequestStatus)) {
      return NextResponse.json({ error: 'Выберите корректный статус заявки' }, { status: 400 });
    }
    if (adminNote === null) {
      return NextResponse.json({ error: 'Комментарий администратора передан неверно' }, { status: 400 });
    }
    if (resultFileUrl === null) {
      return NextResponse.json(
        { error: 'Ссылка на готовый файл должна начинаться с http://, https:// или /' },
        { status: 400 }
      );
    }

    const beforeResult = await query<{
      id: string;
      email: string;
      name: string;
      description: string;
      age_group: string;
      document_type: string;
      status: string;
      result_file_url: string | null;
      admin_note: string | null;
      updated_at: string;
    }>(
      `
        SELECT id, email, name, description, age_group, document_type, status, result_file_url, admin_note, updated_at
        FROM document_requests
        WHERE id = $1
        LIMIT 1
      `,
      [requestId]
    );

    if (beforeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    const before = beforeResult.rows[0];

    const afterResult = await query<typeof before>(
      `
        UPDATE document_requests
        SET status = $2,
            result_file_url = $3,
            admin_note = $4,
            updated_at = now()
        WHERE id = $1
        RETURNING id, email, name, description, age_group, document_type, status, result_file_url, admin_note, updated_at
      `,
      [requestId, status, resultFileUrl || null, adminNote || null]
    );

    const after = afterResult.rows[0];

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before_data, after_data)
       VALUES ($1, 'document_request.update', 'document_request', $2, $3::jsonb, $4::jsonb)`,
      [
        user!.id,
        requestId,
        JSON.stringify(publicRequest(before)),
        JSON.stringify(publicRequest(after)),
      ]
    );

    return NextResponse.json({
      ok: true,
      item: publicRequest(after),
    });
  } catch (err) {
    console.error('[api/admin/document-requests/:requestId PATCH]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
