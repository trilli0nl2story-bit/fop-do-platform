import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';
import { buildConsentMeta, ensureConsentColumns } from '@/src/server/publicFormConsent';

export const dynamic = 'force-dynamic';

type CreateDocumentRequestBody = {
  email?: string;
  name?: string;
  topic?: string;
  ageGroup?: string;
  documentType?: string;
  description?: string;
  consent?: boolean;
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
      { error: 'invalid_json', message: 'РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ Р·Р°СЏРІРєСѓ. РћР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.' },
      { status: 400 }
    );
  }

  const email = normalizeText(body.email, 200) || sessionUser?.email || '';
  const name = normalizeText(body.name, 120);
  const topic = normalizeText(body.topic, 180);
  const ageGroup = normalizeText(body.ageGroup, 120);
  const documentType = normalizeText(body.documentType, 120);
  const description = normalizeText(body.description, 5000);
  const consentAccepted = body.consent === true;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'invalid_email', message: 'РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ email РґР»СЏ СЃРІСЏР·Рё РїРѕ Р·Р°СЏРІРєРµ.' },
      { status: 400 }
    );
  }

  if (!topic) {
    return NextResponse.json(
      { error: 'missing_topic', message: 'РЈРєР°Р¶РёС‚Рµ С‚РµРјСѓ РјР°С‚РµСЂРёР°Р»Р°.' },
      { status: 400 }
    );
  }

  if (!description) {
    return NextResponse.json(
      { error: 'missing_description', message: 'РћРїРёС€РёС‚Рµ, РєР°РєРѕР№ РґРѕРєСѓРјРµРЅС‚ РЅСѓР¶РµРЅ Рё С‡С‚Рѕ РІ РЅС‘Рј РІР°Р¶РЅРѕ.' },
      { status: 400 }
    );
  }

  if (!consentAccepted) {
    return NextResponse.json(
      { error: 'missing_consent', message: 'Нужно подтвердить согласие на обработку персональных данных.' },
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
      'РЎР»РёС€РєРѕРј РјРЅРѕРіРѕ Р·Р°СЏРІРѕРє Р·Р° РєРѕСЂРѕС‚РєРѕРµ РІСЂРµРјСЏ. РџРѕРґРѕР¶РґРёС‚Рµ РЅРµРјРЅРѕРіРѕ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.'
    );
  }

  const fullDescription = [`РўРµРјР°: ${topic}`, description].join('\n\n');
  const consentMeta = buildConsentMeta(request);

  try {
    await ensureConsentColumns('document_requests');
    const result = await query<{ id: string; status: string; created_at: string }>(
      `
        INSERT INTO document_requests (
          user_id,
          email,
          name,
          description,
          age_group,
          document_type,
          consent_accepted_at,
          consent_ip,
          consent_user_agent,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'received', now(), now())
        RETURNING id, status, created_at
      `,
      [
        sessionUser?.id ?? null,
        email,
        name,
        fullDescription,
        ageGroup,
        documentType,
        consentMeta.acceptedAt,
        consentMeta.ip,
        consentMeta.userAgent,
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
        ? 'Р—Р°СЏРІРєР° РїСЂРёРЅСЏС‚Р°. РћРЅР° РїРѕСЏРІРёС‚СЃСЏ РІ РІР°С€РµРј РєР°Р±РёРЅРµС‚Рµ.'
        : 'Р—Р°СЏРІРєР° РїСЂРёРЅСЏС‚Р°. РњС‹ СЃРІСЏР¶РµРјСЃСЏ СЃ РІР°РјРё РїРѕ СѓРєР°Р·Р°РЅРЅРѕРјСѓ email.',
    });
  } catch (error) {
    console.error('[api/document-requests]', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'internal_error', message: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.' },
      { status: 500 }
    );
  }
}

