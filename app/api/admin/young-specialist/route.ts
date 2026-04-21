import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

type YoungSpecialistStatus = 'new' | 'in_progress' | 'answered' | 'closed' | 'published';

const YOUNG_SPECIALIST_STATUSES = new Set<YoungSpecialistStatus>([
  'new',
  'in_progress',
  'answered',
  'closed',
  'published',
]);

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { error: null };
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? '';

    if (status && !YOUNG_SPECIALIST_STATUSES.has(status as YoungSpecialistStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await query<{
      id: string;
      user_id: string | null;
      ticket_id: string;
      account_email: string | null;
      name: string;
      age: number | null;
      city: string;
      email: string;
      position: string;
      group_age: string;
      program: string;
      topic: string;
      question: string;
      vk_link: string | null;
      telegram_link: string | null;
      status: string;
      assigned_expert: string | null;
      answer: string | null;
      admin_note: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT
          ysq.id,
          ysq.user_id,
          ysq.ticket_id,
          u.email AS account_email,
          ysq.name,
          ysq.age,
          ysq.city,
          ysq.email,
          ysq.position,
          ysq.group_age,
          ysq.program,
          ysq.topic,
          ysq.question,
          ysq.vk_link,
          ysq.telegram_link,
          ysq.status,
          ysq.assigned_expert,
          ysq.answer,
          ysq.admin_note,
          ysq.created_at,
          ysq.updated_at
        FROM young_specialist_questions ysq
        LEFT JOIN users u ON u.id = ysq.user_id
        WHERE (
          $1 = ''
          OR ysq.ticket_id ILIKE $2
          OR ysq.name ILIKE $2
          OR ysq.email ILIKE $2
          OR ysq.city ILIKE $2
          OR ysq.topic ILIKE $2
          OR ysq.question ILIKE $2
          OR COALESCE(u.email, '') ILIKE $2
        )
          AND ($3 = '' OR ysq.status = $3)
        ORDER BY ysq.created_at DESC
        LIMIT 100
      `,
      [search, `%${search}%`, status]
    );

    return NextResponse.json({
      items: result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        ticketId: row.ticket_id,
        accountEmail: row.account_email,
        name: row.name,
        age: row.age,
        city: row.city,
        email: row.email,
        position: row.position,
        groupAge: row.group_age,
        program: row.program,
        topic: row.topic,
        question: row.question,
        vkLink: row.vk_link ?? '',
        telegramLink: row.telegram_link ?? '',
        status: row.status,
        assignedExpert: row.assigned_expert ?? '',
        answer: row.answer ?? '',
        adminNote: row.admin_note ?? '',
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/admin/young-specialist]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
