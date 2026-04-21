import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

const FIELD_LIMITS = {
  name: 80,
  lastName: 80,
  patronymic: 80,
  role: 120,
  city: 120,
  institution: 180,
  phone: 40,
} as const;

function normalizeText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

export async function PATCH(request: Request) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await consumeRequestRateLimit(request, {
      scope: 'account-profile-update',
      limit: 20,
      windowSeconds: 60,
      keyParts: [user.id],
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json().catch(() => ({}));
    const profile = {
      name: normalizeText(body.name, FIELD_LIMITS.name),
      lastName: normalizeText(body.lastName, FIELD_LIMITS.lastName),
      patronymic: normalizeText(body.patronymic, FIELD_LIMITS.patronymic),
      role: normalizeText(body.role, FIELD_LIMITS.role),
      city: normalizeText(body.city, FIELD_LIMITS.city),
      institution: normalizeText(body.institution, FIELD_LIMITS.institution),
      phone: normalizeText(body.phone, FIELD_LIMITS.phone),
    };

    const result = await query<{
      name: string;
      last_name: string;
      patronymic: string;
      role: string;
      city: string;
      institution: string;
      phone: string;
    }>(
      `
        INSERT INTO user_profiles (
          id,
          name,
          last_name,
          patronymic,
          role,
          city,
          institution,
          phone,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          last_name = EXCLUDED.last_name,
          patronymic = EXCLUDED.patronymic,
          role = EXCLUDED.role,
          city = EXCLUDED.city,
          institution = EXCLUDED.institution,
          phone = EXCLUDED.phone,
          updated_at = now()
        RETURNING name, last_name, patronymic, role, city, institution, phone
      `,
      [
        user.id,
        profile.name,
        profile.lastName,
        profile.patronymic,
        profile.role,
        profile.city,
        profile.institution,
        profile.phone,
      ]
    );

    const row = result.rows[0];

    return NextResponse.json({
      ok: true,
      profile: {
        name: row?.name ?? '',
        lastName: row?.last_name ?? '',
        patronymic: row?.patronymic ?? '',
        role: row?.role ?? '',
        city: row?.city ?? '',
        institution: row?.institution ?? '',
        phone: row?.phone ?? '',
      },
    });
  } catch (error) {
    console.error('[api/account/profile]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
