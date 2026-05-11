import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { bootstrapAdminAccount } from '@/src/server/adminBootstrap';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';

const CONFIRM_PHRASE = 'PROMOTE_OWNER_ADMIN';
const TOKEN_PLACEHOLDER = 'replace-with-random-32-plus-character-token';

interface BootstrapConfig {
  email: string;
  password: string;
  token: string;
  displayName: string;
}

function notFound(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

function normalizeSecret(value: string | null): string {
  return value?.trim() ?? '';
}

function readConfig(): BootstrapConfig | null {
  if (process.env.ADMIN_BOOTSTRAP_ENABLED !== 'true') {
    return null;
  }

  const email = normalizeSecret(process.env.ADMIN_BOOTSTRAP_EMAIL ?? null).toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? '';
  const token = normalizeSecret(process.env.ADMIN_BOOTSTRAP_TOKEN ?? null);
  const displayName = normalizeSecret(process.env.ADMIN_BOOTSTRAP_NAME ?? null) || 'Admin';
  const confirm = normalizeSecret(process.env.ADMIN_BOOTSTRAP_CONFIRM ?? null);

  if (
    !email ||
    !password ||
    password.length < 12 ||
    token.length < 32 ||
    token === TOKEN_PLACEHOLDER ||
    confirm !== CONFIRM_PHRASE
  ) {
    return null;
  }

  return { email, password, token, displayName };
}

function getSubmittedToken(request: NextRequest): string {
  const headerToken = request.headers.get('x-admin-bootstrap-token');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : '';

  return normalizeSecret(headerToken || bearerToken || '');
}

function secretEquals(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  const config = readConfig();
  if (!config) return notFound();

  const rate = await consumeRequestRateLimit(request, {
    scope: 'auth-admin-bootstrap',
    limit: 5,
    windowSeconds: 60 * 60,
    keyParts: [config.email],
  });
  if (!rate.allowed) {
    return rateLimitResponse(rate);
  }

  const submittedToken = getSubmittedToken(request);
  if (!submittedToken || !secretEquals(submittedToken, config.token)) {
    return notFound();
  }

  if (request.headers.get('origin') || request.headers.get('referer')) {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;
  }

  const body = (await request.json().catch(() => null)) as
    | { confirm?: string }
    | null;

  if (body?.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: 'missing_confirm' },
      { status: 400 }
    );
  }

  const result = await bootstrapAdminAccount({
    email: config.email,
    password: config.password,
    displayName: config.displayName,
  });

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    email: result.email,
    userId: result.userId,
    next: 'Disable and remove all ADMIN_BOOTSTRAP_* secrets, then sign in with the new password.',
  });
}
