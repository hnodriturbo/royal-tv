import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async () => {
  const trials = await prisma.freeTrial.findMany({ include: { user: true } });
  return NextResponse.json({ trials });
});
