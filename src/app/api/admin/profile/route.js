import logger from '@/lib/core/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole, getUserId } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async (_req, _ctx, session) => {
  const user_id = getUserId(session);
  if (!user_id) return NextResponse.json({ error: 'No user in session' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      name: true,
      email: true,
      username: true,
      whatsapp: true,
      telegram: true,
      preferredContactWay: true,
      sendEmails: true,
      createdAt: true,
      updatedAt: true,
      role: true
    }
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
});

export const PATCH = withRole('admin', async (request, _ctx, session) => {
  try {
    const user_id = getUserId(session);
    if (!user_id) return NextResponse.json({ error: 'No user in session' }, { status: 401 });

    const { name, email, username, whatsapp, telegram, preferredContactWay, sendEmails } =
      await request.json();

    const updatedUser = await prisma.user.update({
      where: { user_id },
      data: { name, email, username, whatsapp, telegram, preferredContactWay, sendEmails },
      select: {
        user_id: true,
        name: true,
        email: true,
        username: true,
        whatsapp: true,
        telegram: true,
        preferredContactWay: true,
        sendEmails: true,
        createdAt: true,
        updatedAt: true,
        role: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('[API PATCH] Error updating profile:', error?.message || error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? `Internal Server Error: ${error?.message || error}`
            : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
});
