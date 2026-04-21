import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type AuthorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'revision';

const AUTHOR_APPLICATION_STATUSES = new Set<AuthorApplicationStatus>([
  'pending',
  'approved',
  'rejected',
  'revision',
]);

interface Params {
  params: Promise<{ applicationId: string }>;
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

function publicApplication(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: string;
  position: string;
  bio: string;
  status: string;
  employment_type: string;
  document_url: string | null;
  admin_note: string | null;
  updated_at: string;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    experience: row.experience,
    position: row.position,
    bio: row.bio,
    status: row.status,
    employmentType: row.employment_type,
    documentUrl: row.document_url ?? '',
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
      scope: 'admin-author-applications-write',
      limit: 40,
      windowSeconds: 5 * 60,
      keyParts: [user!.id],
    });
    if (!rate.allowed) {
      return rateLimitResponse(
        rate,
        'Слишком много изменений авторских заявок за короткое время. Подождите немного и попробуйте ещё раз.'
      );
    }

    const { applicationId } = await params;
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const status = cleanText(body.status, 40);
    const adminNote = cleanText(body.adminNote, 5000);
    const documentUrl = cleanUrl(body.documentUrl);

    if (!status || !AUTHOR_APPLICATION_STATUSES.has(status as AuthorApplicationStatus)) {
      return NextResponse.json({ error: 'Выберите корректный статус заявки' }, { status: 400 });
    }
    if (adminNote === null) {
      return NextResponse.json({ error: 'Комментарий администратора передан неверно' }, { status: 400 });
    }
    if (documentUrl === null) {
      return NextResponse.json(
        { error: 'Ссылка на документ должна начинаться с http://, https:// или /' },
        { status: 400 }
      );
    }

    const beforeResult = await query<{
      id: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      experience: string;
      position: string;
      bio: string;
      status: string;
      employment_type: string;
      document_url: string | null;
      admin_note: string | null;
      updated_at: string;
    }>(
      `
        SELECT id, name, email, phone, city, experience, position, bio, status, employment_type, document_url, admin_note, updated_at
        FROM author_applications
        WHERE id = $1
        LIMIT 1
      `,
      [applicationId]
    );

    if (beforeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    const before = beforeResult.rows[0];

    const afterResult = await query<typeof before>(
      `
        UPDATE author_applications
        SET status = $2,
            document_url = $3,
            admin_note = $4,
            updated_at = now()
        WHERE id = $1
        RETURNING id, name, email, phone, city, experience, position, bio, status, employment_type, document_url, admin_note, updated_at
      `,
      [applicationId, status, documentUrl || null, adminNote || null]
    );

    const after = afterResult.rows[0];

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before_data, after_data)
       VALUES ($1, 'author_application.update', 'author_application', $2, $3::jsonb, $4::jsonb)`,
      [
        user!.id,
        applicationId,
        JSON.stringify(publicApplication(before)),
        JSON.stringify(publicApplication(after)),
      ]
    );

    return NextResponse.json({
      ok: true,
      item: publicApplication(after),
    });
  } catch (err) {
    console.error('[api/admin/author-applications/:applicationId PATCH]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
