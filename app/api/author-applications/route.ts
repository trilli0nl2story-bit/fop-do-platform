import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type CreateAuthorApplicationBody = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  experience?: string;
  position?: string;
  bio?: string;
  employmentType?: string;
  sampleUrl?: string;
};

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidOptionalUrl(value: string): boolean {
  return !value || /^https?:\/\//i.test(value) || value.startsWith('/');
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const sessionUser = await getCurrentUser();

  let body: CreateAuthorApplicationBody;
  try {
    body = (await request.json()) as CreateAuthorApplicationBody;
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Не удалось прочитать заявку. Обновите страницу и попробуйте ещё раз.' },
      { status: 400 }
    );
  }

  const name = normalizeText(body.name, 160);
  const email = normalizeText(body.email, 200) || sessionUser?.email || '';
  const phone = normalizeText(body.phone, 60);
  const city = normalizeText(body.city, 120);
  const experience = normalizeText(body.experience, 300);
  const position = normalizeText(body.position, 160);
  const bio = normalizeText(body.bio, 5000);
  const employmentType = normalizeText(body.employmentType, 60);
  const sampleUrl = normalizeText(body.sampleUrl, 1000);

  if (!name) {
    return NextResponse.json(
      { error: 'missing_name', message: 'Укажите имя и фамилию.' },
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
      { error: 'missing_position', message: 'Укажите должность или роль.' },
      { status: 400 }
    );
  }

  if (!bio) {
    return NextResponse.json(
      { error: 'missing_bio', message: 'Расскажите немного о себе и о материалах, которые хотите публиковать.' },
      { status: 400 }
    );
  }

  if (!['self_employed', 'individual_entrepreneur'].includes(employmentType)) {
    return NextResponse.json(
      { error: 'invalid_employment_type', message: 'Выберите статус занятости.' },
      { status: 400 }
    );
  }

  if (!isValidOptionalUrl(sampleUrl)) {
    return NextResponse.json(
      { error: 'invalid_sample_url', message: 'Ссылка на пример материала должна начинаться с http://, https:// или /' },
      { status: 400 }
    );
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    scope: 'author-applications:create',
    limit: 3,
    windowSeconds: 60 * 60,
    keyParts: [sessionUser?.id ?? null, email],
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(
      rateLimit,
      'Слишком много заявок за короткое время. Подождите немного и попробуйте снова.'
    );
  }

  try {
    const result = await query<{ id: string; status: string; created_at: string }>(
      `
        INSERT INTO author_applications (
          user_id,
          name,
          email,
          phone,
          city,
          experience,
          position,
          bio,
          status,
          employment_type,
          document_url,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, now(), now())
        RETURNING id, status, created_at
      `,
      [
        sessionUser?.id ?? null,
        name,
        email,
        phone,
        city,
        experience,
        position,
        bio,
        employmentType,
        sampleUrl || null,
      ]
    );

    const row = result.rows[0];
    if (!row) throw new Error('author_application_not_created');

    return NextResponse.json({
      ok: true,
      application: {
        id: row.id,
        status: row.status,
        createdAt: new Date(row.created_at).toISOString(),
      },
      message: 'Заявка автора принята. Мы свяжемся с вами после рассмотрения.',
    });
  } catch (error) {
    console.error('[api/author-applications]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'internal_error', message: 'Не удалось отправить заявку автора. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
