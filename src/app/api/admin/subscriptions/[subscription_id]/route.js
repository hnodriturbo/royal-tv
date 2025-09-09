import logger from '@/lib/core/logger';
import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: return ALL subscriptions for the owner of subscription_id (main first)
export const GET = withRole('admin', async (_req, ctx) => {
  const { subscription_id } = ctx.params;
  if (!subscription_id) {
    return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });
  }

  const mainSubscription = await prisma.subscription.findUnique({
    where: { subscription_id },
    include: { user: true, payments: true }
  });

  if (!mainSubscription) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const user_id = mainSubscription.user.user_id;

  let allSubs = await prisma.subscription.findMany({
    where: { user_id },
    include: { payments: true },
    orderBy: { createdAt: 'desc' }
  });

  // Ensure main first
  allSubs = [mainSubscription, ...allSubs.filter((s) => s.subscription_id !== subscription_id)];

  return NextResponse.json({
    subscriptions: allSubs,
    user: mainSubscription.user
  });
});

// DELETE: delete a subscription by id (admin)
export const DELETE = withRole('admin', async (_req, ctx) => {
  const { subscription_id } = ctx.params;
  if (!subscription_id) {
    return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });
  }

  const exists = await prisma.subscription.findUnique({ where: { subscription_id } });
  if (!exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.subscription.delete({ where: { subscription_id } });
  logger.log(`🗑️ Deleted subscription: ${subscription_id}`);
  return NextResponse.json({ ok: true });
});
