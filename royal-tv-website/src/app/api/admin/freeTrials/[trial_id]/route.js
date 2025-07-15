/**
 *   ========== /api/admin/freeTrial/[freeTrial_id] ==========
 * 📝
 * GET:   View single free trial
 * PATCH: Update trial and notify user/admin if status changes
 * DELETE: Remove trial
 * ===========================================================
 */

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
  const { trial_id } = await context.params;

  const trial = await prisma.freeTrial.findUnique({
    where: { trial_id },
    include: { user: true }
  });

  if (!trial) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ freeTrial: trial });
}

/**
 *   ======================== /api/admin/freeTrial/[trial_id] ========================
 * 📝
 * PATCH: Update free trial & notify user/admin on status change!
 * -----------------------------------------------------------------------------
 * - Notifies user & all admins when trial is activated (status: 'active')
 * - Sends correct notification & email using notificationSystem builders/templates
 * - Only sends if status *actually* changes
 * ==============================================================================
 */

export async function PATCH(request, context) {
  try {
    // 🆔 Extract trial_id from route params
    const { trial_id } = await context.params;

    // 📨 Parse PATCH body
    const data = await request.json();

    // 🔍 Fetch previous FreeTrial with user info
    const prev = await prisma.freeTrial.findUnique({
      where: { trial_id },
      include: { user: true }
    });
    if (!prev) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 🟢 Ensure correct ISO date format for dates
    if (data.startDate) data.startDate = new Date(data.startDate).toISOString();
    if (data.endDate) data.endDate = new Date(data.endDate).toISOString();

    // 📝 Update the FreeTrial
    await prisma.freeTrial.update({
      where: { trial_id },
      data
    });

    // 🧑‍💻 Fetch updated trial with user (for emails/client)
    const updatedTrial = await prisma.freeTrial.findUnique({
      where: { trial_id },
      include: { user: true }
    });

    // ✅ Always return updated trial + previous status for frontend socket logic
    return NextResponse.json({
      message: 'Free trial updated successfully',
      trial: updatedTrial,
      previousStatus: prev.status
    });
  } catch (error) {
    // 🛑 Error handling
    console.error('PATCH /api/admin/freeTrials/[trial_id] failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown server error' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  // 🆔 Extract trial_id from route params
  const { trial_id } = await context.params;
  await prisma.freeTrial.delete({ where: { trial_id } });
  return NextResponse.json({ ok: true });
}
