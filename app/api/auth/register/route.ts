import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/server/db';
import {
  hashPassword,
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

  const { name, role, city, email, password } = body;

  // ── Validate ────────────────────────────────────────────────────────────────
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Пароль должен содержать не менее 8 символов' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // ── Check duplicate ─────────────────────────────────────────────────────────
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

    // ── Hash password ───────────────────────────────────────────────────────
    const passwordHash = await hashPassword(password);

    // ── Insert user ─────────────────────────────────────────────────────────
    const { rows: [user] } = await query<{
      id: string;
      email: string;
      is_admin: boolean;
    }>(
      `INSERT INTO users (email, password_hash, is_admin, created_at, updated_at)
       VALUES ($1, $2, false, now(), now())
       RETURNING id, email, is_admin`,
      [normalizedEmail, passwordHash]
    );

    // ── Insert profile ──────────────────────────────────────────────────────
    await query(
      `INSERT INTO user_profiles (id, name, role, city, updated_at)
       VALUES ($1, $2, $3, $4, now())`,
      [
        user.id,
        typeof name === 'string' ? name.trim() : '',
        typeof role === 'string' ? role.trim() : '',
        typeof city === 'string' ? city.trim() : '',
      ]
    );

    // ── Create session ──────────────────────────────────────────────────────
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
    });

    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, isAdmin: user.is_admin } },
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
