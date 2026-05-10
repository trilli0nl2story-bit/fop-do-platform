import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/src/server/db';
import {
  createSessionToken,
  getSessionUserById,
  hashPassword,
  setSessionCookie,
} from '@/src/server/auth';
import { verifyCaptchaToken } from '@/src/server/captcha';
import { issueEmailVerification } from '@/src/server/emailVerification';
import { ensureUserReferralProfile } from '@/src/server/referrals';
import { ensureConsentsTable, recordConsent } from '@/src/server/consents';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

function boolFromBody(value: unknown): boolean {
  return value === true;
}

function getConsentFlags(body: Record<string, unknown>) {
  const nested = body.consents && typeof body.consents === 'object'
    ? body.consents as Record<string, unknown>
    : {};
  const legacyCombinedConsent = boolFromBody(body.consent);

  return {
    personalData: boolFromBody(nested.personalData) || boolFromBody(body.personalDataConsent) || legacyCombinedConsent,
    terms: boolFromBody(nested.terms) || boolFromBody(body.termsConsent) || legacyCombinedConsent,
    marketing: boolFromBody(nested.marketing) || boolFromBody(body.marketingConsent),
    legacyCombinedConsent,
  };
}

export async function POST(req: NextRequest) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;

  const ipRate = await consumeRequestRateLimit(req, {
    scope: 'auth-register-ip',
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!ipRate.allowed) {
    return rateLimitResponse(
      ipRate,
      'Слишком много регистраций с этого адреса. Подождите немного и попробуйте ещё раз.'
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const captchaResult = await verifyCaptchaToken(req, body.captchaToken);
  if (!captchaResult.ok) {
    return NextResponse.json(
      { error: captchaResult.message ?? 'Не удалось пройти проверку.' },
      { status: 400 }
    );
  }

  const { name, role, city, email, password } = body;
  const consentFlags = getConsentFlags(body);

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Пароль должен содержать не менее 8 символов' },
      { status: 400 }
    );
  }

  if (!consentFlags.personalData || !consentFlags.terms) {
    return NextResponse.json(
      {
        error: 'missing_consent',
        message: 'Нужно подтвердить согласие на обработку персональных данных и пользовательское соглашение.',
      },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRate = await consumeRequestRateLimit(req, {
    scope: 'auth-register-email',
    limit: 3,
    windowSeconds: 60 * 60,
    keyParts: [normalizedEmail],
  });
  if (!emailRate.allowed) {
    return rateLimitResponse(
      emailRate,
      'Слишком много попыток регистрации для этого email. Подождите немного и попробуйте ещё раз.'
    );
  }

  try {
    const { rows: existing } = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже зарегистрирован' },
        { status: 409 }
      );
    }

    await ensureConsentsTable();

    const passwordHash = await hashPassword(password);

    const user = await withTransaction(async (client) => {
      const {
        rows: [createdUser],
      } = await client.query<{
        id: string;
        email: string;
      }>(
        `
          INSERT INTO users (email, password_hash, is_admin, email_verified_at, created_at, updated_at)
          VALUES ($1, $2, false, null, now(), now())
          RETURNING id, email
        `,
        [normalizedEmail, passwordHash]
      );

      await client.query(
        `
          INSERT INTO user_profiles (id, name, role, city, updated_at)
          VALUES ($1, $2, $3, $4, now())
        `,
        [
          createdUser.id,
          typeof name === 'string' ? name.trim() : '',
          typeof role === 'string' ? role.trim() : '',
          typeof city === 'string' ? city.trim() : '',
        ]
      );

      const registrationMetadata = {
        formVersion: 'registration-2026-05',
        legacyCombinedConsent: consentFlags.legacyCombinedConsent,
      };

      await recordConsent(
        {
          userId: createdUser.id,
          email: createdUser.email,
          formName: 'registration',
          consentType: 'personal_data',
          documentSlug: 'personal-data-consent',
          metadata: {
            ...registrationMetadata,
            linkedDocumentSlugs: ['privacy-policy'],
          },
        },
        req,
        client
      );

      await recordConsent(
        {
          userId: createdUser.id,
          email: createdUser.email,
          formName: 'registration',
          consentType: 'terms',
          documentSlug: 'terms',
          metadata: registrationMetadata,
        },
        req,
        client
      );

      if (consentFlags.marketing) {
        await recordConsent(
          {
            userId: createdUser.id,
            email: createdUser.email,
            formName: 'registration',
            consentType: 'marketing',
            documentSlug: 'marketing-consent',
            metadata: registrationMetadata,
          },
          req,
          client
        );
      }

      return createdUser;
    });

    try {
      await ensureUserReferralProfile(user.id, user.email);
    } catch (referralError) {
      console.error(
        '[api/auth/register] referral profile setup failed',
        referralError instanceof Error ? referralError.message : String(referralError)
      );
    }

    let delivery: { delivered: boolean; mode: 'smtp' | 'disabled' } = {
      delivered: false,
      mode: 'disabled',
    };

    try {
      delivery = await issueEmailVerification({
        userId: user.id,
        email: user.email,
        requestOrigin: new URL(req.url).origin,
      });
    } catch (emailError) {
      console.error(
        '[api/auth/register] verification email failed',
        emailError instanceof Error ? emailError.message : String(emailError)
      );
    }

    const sessionUser = await getSessionUserById(user.id);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Ошибка сервера. Попробуйте позже.' },
        { status: 500 }
      );
    }

    const token = await createSessionToken(sessionUser);

    const response = NextResponse.json(
      {
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          isAdmin: sessionUser.isAdmin,
          emailVerified: sessionUser.emailVerified,
        },
        verification: {
          sent: delivery.delivered,
          deliveryMode: delivery.mode,
        },
      },
      { status: 201 }
    );
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[api/auth/register]', err);
    return NextResponse.json(
      { error: 'Ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
