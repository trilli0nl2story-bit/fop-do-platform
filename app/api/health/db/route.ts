import { NextResponse } from 'next/server';
import { ping } from '@/src/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, configured: false, reachable: false, message: 'DATABASE_URL is not configured' },
      { status: 200 }
    );
  }

  const reachable = await ping();

  if (reachable) {
    return NextResponse.json(
      { ok: true, configured: true, reachable: true, message: 'Database connection is healthy' },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { ok: false, configured: true, reachable: false, message: 'Database connection failed' },
    { status: 200 }
  );
}
