import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async () => {
  const subscriptions = await prisma.subscription.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ subscriptions });
});
