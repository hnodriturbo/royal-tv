import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole, getUserId } from '@/lib/api/guards';

export const GET = withRole('user', async (_req, _ctx, session) => {
  const user_id = getUserId(session);

  try {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(freeTrial ?? null);
  } catch (error) {
    // Mark variable as used to satisfy no-unused-vars without changing behavior
    void error;
    return NextResponse.json({ error: 'Failed to fetch free trial' }, { status: 500 });
  }
});
