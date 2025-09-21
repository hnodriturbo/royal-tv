import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';
import { withRole, getUserId } from '@/lib/api/guards';

export const GET = withRole('user', async (_req, _ctx, session) => {
  const user_id = getUserId(session);

  const subscriptions = await prisma.subscription.findMany({
    where: { user_id },
    orderBy: { createdAt: 'desc' },
    include: { payments: true }
  });

  return NextResponse.json({ subscriptions });
});
