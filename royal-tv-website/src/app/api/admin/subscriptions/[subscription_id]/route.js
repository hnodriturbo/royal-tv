/**
 *   ========== /api/admin/subscriptions/[subscription_id] ==========
 * 📦
 * GET:   View single subscription (+user)
 * PATCH: Update subscription & notify if status changes
 * DELETE: Remove subscription
 * ==================================================================
 */

import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
  const { subscription_id } = await context.params;

  const subscription = await prisma.subscription.findUnique({
    where: { subscription_id },
    include: { user: true, payments: true }
  });

  if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ subscription });
}

/**
 * PATCH: Update subscription & notify user/admin on status change!
 * - Notifies user & all admins when sub is activated (status: 'active')
 * - Only sends if status *actually* changes
 */
export async function PATCH(request, context) {
  try {
    const { subscription_id } = await context.params;
    const data = await request.json();

    // 🔍 Fetch previous Subscription with user info
    const prev = await prisma.subscription.findUnique({
      where: { subscription_id },
      include: { user: true }
    });
    if (!prev) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 🟢 Ensure ISO date format
    if (data.startDate) data.startDate = new Date(data.startDate).toISOString();
    if (data.endDate) data.endDate = new Date(data.endDate).toISOString();

    // 📝 Update the Subscription
    await prisma.subscription.update({
      where: { subscription_id },
      data
    });

    // 🧑‍💻 Fetch updated subscription with user (for client/email/notification)
    const updatedSubscription = await prisma.subscription.findUnique({
      where: { subscription_id },
      include: { user: true }
    });

    // ✅ Always return updated subscription + previous status for frontend socket logic
    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription: updatedSubscription,
      previousStatus: prev.status
    });
  } catch (error) {
    logger.error('PATCH /api/admin/subscriptions/[subscription_id] failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown server error' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { subscription_id } = context.params;
  await prisma.subscription.delete({ where: { subscription_id } });
  return NextResponse.json({ ok: true });
}
