import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { query } from './db';

export const SESSION_COOKIE = 'metod_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
const SALT_ROUNDS = 12;

let sessionVersionReady: Promise<void> | null = null;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      '[auth] SESSION_SECRET is not set. Generate one with: openssl rand -hex 32'
    );
  }

  return new TextEncoder().encode(secret);
}

async function ensureSessionVersionSupport(): Promise<void> {
  if (!sessionVersionReady) {
    sessionVersionReady = (async () => {
      await query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1
      `);
    })().catch((error) => {
      sessionVersionReady = null;
      throw error;
    });
  }

  await sessionVersionReady;
}

interface SessionUserRow {
  id: string;
  email: string;
  is_admin: boolean;
  email_verified_at: string | null;
  session_version: number;
}

function mapSessionUser(row: SessionUserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    isAdmin: row.is_admin,
    emailVerified: Boolean(row.email_verified_at),
    sessionVersion: Number(row.session_version ?? 1),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  sessionVersion: number;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
    sessionVersion: user.sessionVersion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin === true,
      emailVerified: payload.emailVerified === true,
      sessionVersion:
        typeof payload.sessionVersion === 'number' &&
        Number.isFinite(payload.sessionVersion)
          ? payload.sessionVersion
          : 1,
    };
  } catch {
    return null;
  }
}

export async function getSessionUserById(
  userId: string
): Promise<SessionUser | null> {
  await ensureSessionVersionSupport();

  const result = await query<SessionUserRow>(
    `
      SELECT id, email, is_admin, email_verified_at, session_version
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0];
  return row ? mapSessionUser(row) : null;
}

export async function bumpUserSessionVersion(
  userId: string
): Promise<SessionUser | null> {
  await ensureSessionVersionSupport();

  const result = await query<SessionUserRow>(
    `
      UPDATE users
      SET session_version = session_version + 1,
          updated_at = now()
      WHERE id = $1
      RETURNING id, email, is_admin, email_verified_at, session_version
    `,
    [userId]
  );

  const row = result.rows[0];
  return row ? mapSessionUser(row) : null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const tokenUser = await verifySessionToken(token);
    if (!tokenUser) return null;

    const currentUser = await getSessionUserById(tokenUser.id);
    if (!currentUser) return null;

    if (currentUser.sessionVersion !== tokenUser.sessionVersion) {
      return null;
    }

    return currentUser;
  } catch {
    return null;
  }
}

export function setSessionCookie(
  response: NextResponse,
  token: string
): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
