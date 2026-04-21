import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type CreateYoungSpecialistBody = {
  name?: string;
  age?: string | number;
  city?: string;
  email?: string;
  position?: string;
  groupAge?: string;
  program?: string;
  topic?: string;
  question?: string;
  vkLink?: string;
  telegramLink?: string;
};

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeOptionalUrl(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, maxLength);
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

function normalizeAge(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 18 || parsed > 90) return null;
  return Math.round(parsed);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildTicketId() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix = randomInt(1000, 9999);
  return `MS-${yyyy}${mm}${dd}-${suffix}`;
}

async function createUniqueTicketId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const ticketId = buildTicketId();
    const existing = await query<{ id: string }>(
      'SELECT id FROM young_specialist_questions WHERE ticket_id = $1 LIMIT 1',
      [ticketId]
    );
    if (existing.rows.length === 0) {
      return ticketId;
    }
  }

  throw new Error('ticket_id_generation_failed');
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const sessionUser = await getCurrentUser();

  let body: CreateYoungSpecialistBody;
  try {
    body = (await request.json()) as CreateYoungSpecialistBody;
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Не удалось прочитать вопрос. Обновите страницу и попробуйте ещё раз.' },
      { status: 400 }
    );
  }

  const name = normalizeText(body.name, 160);
  const age = normalizeAge(body.age);
  const city = normalizeText(body.city, 120);
  const email = normalizeText(body.email, 200) || sessionUser?.email || '';
  const position = normalizeText(body.position, 160);
  const groupAge = normalizeText(body.groupAge, 120);
  const program = normalizeText(body.program, 160);
  const topic = normalizeText(body.topic, 220);
  const question = normalizeText(body.question, 5000);
  const vkLink = normalizeOptionalUrl(body.vkLink, 1000);
  const telegramLink = normalizeOptionalUrl(body.telegramLink, 1000);

  if (!name) {
    return NextResponse.json(
      { error: 'missing_name', message: 'Укажите имя.' },
      { status: 400 }
    );
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'invalid_email', message: 'Укажите корректный email.' },
      { status: 400 }
    );
  }

  if (!position) {
    return NextResponse.json(
      { error: 'missing_position', message: 'Укажите должность.' },
      { status: 400 }
    );
  }

  if (!topic) {
    return NextResponse.json(
      { error: 'missing_topic', message: 'Укажите тему вопроса.' },
      { status: 400 }
    );
  }

  if (!question) {
    return NextResponse.json(
      { error: 'missing_question', message: 'Опишите ваш вопрос.' },
      { status: 400 }
    );
  }

  if (body.age !== undefined && body.age !== null && body.age !== '' && age === null) {
    return NextResponse.json(
      { error: 'invalid_age', message: 'Возраст укажите числом от 18 до 90.' },
      { status: 400 }
    );
  }

  if (vkLink === null) {
    return NextResponse.json(
      { error: 'invalid_vk_link', message: 'Ссылка VK должна начинаться с http:// или https://.' },
      { status: 400 }
    );
  }

  if (telegramLink === null) {
    return NextResponse.json(
      { error: 'invalid_telegram_link', message: 'Ссылка Telegram должна начинаться с http:// или https://.' },
      { status: 400 }
    );
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    scope: 'young-specialist:create',
    limit: 5,
    windowSeconds: 60 * 60,
    keyParts: [sessionUser?.id ?? null, email],
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(
      rateLimit,
      'Слишком много вопросов за короткое время. Подождите немного и попробуйте снова.'
    );
  }

  try {
    const ticketId = await createUniqueTicketId();

    const result = await query<{ id: string; ticket_id: string; status: string; created_at: string }>(
      `
        INSERT INTO young_specialist_questions (
          user_id,
          ticket_id,
          name,
          age,
          city,
          email,
          position,
          group_age,
          program,
          topic,
          question,
          vk_link,
          telegram_link,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'new', now(), now())
        RETURNING id, ticket_id, status, created_at
      `,
      [
        sessionUser?.id ?? null,
        ticketId,
        name,
        age,
        city,
        email,
        position,
        groupAge,
        program,
        topic,
        question,
        vkLink || null,
        telegramLink || null,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('question_not_created');
    }

    return NextResponse.json({
      ok: true,
      question: {
        id: row.id,
        ticketId: row.ticket_id,
        status: row.status,
        createdAt: new Date(row.created_at).toISOString(),
      },
      message: 'Вопрос принят. Мы передадим его эксперту и сохраним номер обращения.',
    });
  } catch (error) {
    console.error('[api/young-specialist/questions]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'internal_error', message: 'Не удалось отправить вопрос. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
