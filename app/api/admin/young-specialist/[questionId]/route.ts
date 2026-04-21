import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type YoungSpecialistStatus = 'new' | 'in_progress' | 'answered' | 'closed' | 'published';

const YOUNG_SPECIALIST_STATUSES = new Set<YoungSpecialistStatus>([
  'new',
  'in_progress',
  'answered',
  'closed',
  'published',
]);

interface Params {
  params: Promise<{ questionId: string }>;
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

function publicQuestion(row: {
  id: string;
  ticket_id: string;
  name: string;
  email: string;
  topic: string;
  question: string;
  status: string;
  assigned_expert: string | null;
  answer: string | null;
  admin_note: string | null;
  updated_at: string;
}) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    question: row.question,
    status: row.status,
    assignedExpert: row.assigned_expert ?? '',
    answer: row.answer ?? '',
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
      scope: 'admin-young-specialist-write',
      limit: 40,
      windowSeconds: 5 * 60,
      keyParts: [user!.id],
    });
    if (!rate.allowed) {
      return rateLimitResponse(
        rate,
        'Слишком много изменений вопросов за короткое время. Подождите немного и попробуйте ещё раз.'
      );
    }

    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const status = cleanText(body.status, 40);
    const assignedExpert = cleanText(body.assignedExpert, 160);
    const answer = cleanText(body.answer, 5000);
    const adminNote = cleanText(body.adminNote, 5000);

    if (!status || !YOUNG_SPECIALIST_STATUSES.has(status as YoungSpecialistStatus)) {
      return NextResponse.json({ error: 'Выберите корректный статус вопроса' }, { status: 400 });
    }
    if (assignedExpert === null || answer === null || adminNote === null) {
      return NextResponse.json({ error: 'Поля вопроса переданы неверно' }, { status: 400 });
    }

    const beforeResult = await query<{
      id: string;
      ticket_id: string;
      name: string;
      email: string;
      topic: string;
      question: string;
      status: string;
      assigned_expert: string | null;
      answer: string | null;
      admin_note: string | null;
      updated_at: string;
    }>(
      `
        SELECT id, ticket_id, name, email, topic, question, status, assigned_expert, answer, admin_note, updated_at
        FROM young_specialist_questions
        WHERE id = $1
        LIMIT 1
      `,
      [questionId]
    );

    if (beforeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Вопрос не найден' }, { status: 404 });
    }

    const before = beforeResult.rows[0];

    const afterResult = await query<typeof before>(
      `
        UPDATE young_specialist_questions
        SET status = $2,
            assigned_expert = $3,
            answer = $4,
            admin_note = $5,
            updated_at = now()
        WHERE id = $1
        RETURNING id, ticket_id, name, email, topic, question, status, assigned_expert, answer, admin_note, updated_at
      `,
      [questionId, status, assignedExpert || null, answer || null, adminNote || null]
    );

    const after = afterResult.rows[0];

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before_data, after_data)
       VALUES ($1, 'young_specialist.update', 'young_specialist_question', $2, $3::jsonb, $4::jsonb)`,
      [
        user!.id,
        questionId,
        JSON.stringify(publicQuestion(before)),
        JSON.stringify(publicQuestion(after)),
      ]
    );

    return NextResponse.json({
      ok: true,
      item: publicQuestion(after),
    });
  } catch (err) {
    console.error('[api/admin/young-specialist/:questionId PATCH]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
