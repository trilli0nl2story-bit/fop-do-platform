import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/server/db';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from '@/src/server/auth';

export async function POST(req: NextRequest) {
  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const { email, password } = body;

  // ── Validate ────────────────────────────────────────────────────────────────
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
  }
  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Пароль обязателен' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // ── Look up user ────────────────────────────────────────────────────────
    const { rows } = await query<{
      id: string;
      email: string;
      password_hash: string;
      is_admin: boolean;
    }>(
      'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = rows[0];

    // Constant-time comparison: always run verifyPassword even if user not found
    // to prevent timing-based user enumeration.
    const dummyHash =
      '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const passwordHash = user?.password_hash ?? dummyHash;
    const passwordValid = await verifyPassword(password, passwordHash);

    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // ── Create session ──────────────────────────────────────────────────────
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, isAdmin: user.is_admin },
    });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[api/auth/login]', err);
    return NextResponse.json(
      { error: 'Ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
