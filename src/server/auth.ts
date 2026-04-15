/**
 * Server-only auth helpers.
 * Import only in API routes and server components — never in client components.
 *
 * Session strategy: signed JWT stored in an httpOnly cookie.
 *   - Signed with SESSION_SECRET using HS256 (via jose).
 *   - 30-day expiry.
 *   - Never contains the password hash.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'metod_session';
const COOKIE_MAX_AGE      = 30 * 24 * 60 * 60; // 30 days in seconds
const SALT_ROUNDS         = 12;

// ── Secret key ────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      '[auth] SESSION_SECRET is not set. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  return new TextEncoder().encode(secret);
}

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT / session ─────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

/** Create a signed JWT for the given user. */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret());
}

/** Verify a JWT string. Returns the payload or null if invalid/expired. */
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
    };
  } catch {
    return null;
  }
}

/** Read the session cookie and return the current user, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

/** Attach the session cookie to a NextResponse. */
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

/** Clear the session cookie on a NextResponse. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
