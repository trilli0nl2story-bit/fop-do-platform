import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { getUserOrderStatus } from '@/src/server/orders';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = await context.params;
  const order = await getUserOrderStatus(sessionUser.id, orderId);
  if (!order) {
    return NextResponse.json(
      { error: 'not_found', message: 'Заказ не найден.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}
