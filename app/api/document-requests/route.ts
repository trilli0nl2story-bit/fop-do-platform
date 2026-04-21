import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

type CreateDocumentRequestBody = {
  email?: string;
  name?: string;
  topic?: string;
  ageGroup?: string;
  documentType?: string;
  description?: string;
};

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const sessionUser = await getCurrentUser();

  let body: CreateDocumentRequestBody;
  try {
    body = (await request.json()) as CreateDocumentRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Не удалось прочитать заявку. Обновите страницу и попробуйте ещё раз.' },
      { status: 400 }
    );
  }

  const email = normalizeText(body.email, 200) || sessionUser?.email || '';
  const name = normalizeText(body.name, 120);
  const topic = normalizeText(body.topic, 180);
  const ageGroup = normalizeText(body.ageGroup, 120);
  const documentType = normalizeText(body.documentType, 120);
  const description = normalizeText(body.description, 5000);

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'invalid_email', message: 'Укажите корректный email для связи по заявке.' },
      { status: 400 }
    );
  }

  if (!topic) {
    return NextResponse.json(
      { error: 'missing_topic', message: 'Укажите тему материала.' },
      { status: 400 }
    );
  }

  if (!description) {
    return NextResponse.json(
      { error: 'missing_description', message: 'Опишите, какой документ нужен и что в нём важно.' },
      { status: 400 }
    );
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    scope: 'document-requests:create',
    limit: 5,
    windowSeconds: 60 * 60,
    keyParts: [sessionUser?.id ?? null, email],
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(
      rateLimit,
      'Слишком много заявок за короткое время. Подождите немного и попробуйте снова.'
    );
  }

  const fullDescription = [`Тема: ${topic}`, description].join('\n\n');

  try {
    const result = await query<{ id: string; status: string; created_at: string }>(
      `
        INSERT INTO document_requests (
          user_id,
          email,
          name,
          description,
          age_group,
          document_type,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'received', now(), now())
        RETURNING id, status, created_at
      `,
      [
        sessionUser?.id ?? null,
        email,
        name,
        fullDescription,
        ageGroup,
        documentType,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('document_request_not_created');
    }

    return NextResponse.json({
      ok: true,
      request: {
        id: row.id,
        status: row.status,
        createdAt: new Date(row.created_at).toISOString(),
      },
      message: sessionUser
        ? 'Заявка принята. Она появится в вашем кабинете.'
        : 'Заявка принята. Мы свяжемся с вами по указанному email.',
    });
  } catch (error) {
    console.error('[api/document-requests]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'internal_error', message: 'Не удалось отправить заявку. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
