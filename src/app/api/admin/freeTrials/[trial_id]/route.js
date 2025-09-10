
import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getTrialId(ctx) {
  // support both folder names: [freeTrial_id] or [trial_id]
  return ctx?.params?.freeTrial_id ?? ctx?.params?.trial_id ?? null;
}

export const GET = withRole('admin', async (_req, ctx) => {
  const trial_id = getTrialId(ctx);
  if (!trial_id) return NextResponse.json({ error: 'Missing trial_id' }, { status: 400 });

  const trial = await prisma.freeTrial.findUnique({
    where: { trial_id },
    include: { user: true }
  });

  if (!trial) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ freeTrial: trial });
});

export const PATCH = withRole('admin', async (request, ctx) => {
  try {
    const trial_id = getTrialId(ctx);
    if (!trial_id) return NextResponse.json({ error: 'Missing trial_id' }, { status: 400 });

    const data = await request.json();

    const prev = await prisma.freeTrial.findUnique({
      where: { trial_id },
      include: { user: true }
    });
    if (!prev) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (data.startDate) data.startDate = new Date(data.startDate).toISOString();
    if (data.endDate) data.endDate = new Date(data.endDate).toISOString();

    await prisma.freeTrial.update({ where: { trial_id }, data });

    const updatedTrial = await prisma.freeTrial.findUnique({
      where: { trial_id },
      include: { user: true }
    });

    return NextResponse.json({
      message: 'Free trial updated successfully',
      trial: updatedTrial,
      previousStatus: prev.status
    });
  } catch (error) {
    console.error('PATCH /api/admin/freeTrials/[trial_id] failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown server error' }, { status: 500 });
  }
});

export const DELETE = withRole('admin', async (_req, ctx) => {
  const trial_id = getTrialId(ctx);
  if (!trial_id) return NextResponse.json({ error: 'Missing trial_id' }, { status: 400 });

  await prisma.freeTrial.delete({ where: { trial_id } });
  return NextResponse.json({ ok: true });
});
