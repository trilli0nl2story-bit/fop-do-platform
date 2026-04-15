import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/src/server/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
