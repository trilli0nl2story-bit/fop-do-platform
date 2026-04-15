import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error('[api/auth/me]', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
