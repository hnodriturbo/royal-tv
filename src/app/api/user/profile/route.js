
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole, getUserId } from '@/lib/api/guards';

export const GET = withRole('user', async (_req, _ctx, session) => {
  const user_id = getUserId(session);

  try {
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
  } catch (error) {
    console.error('[API GET] Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
});

export const PATCH = withRole('user', async (request, _ctx, session) => {
  const user_id = getUserId(session);

  try {
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
    console.error('[API PATCH] Error updating profile:', error.message);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? `Internal Server Error: ${error.message}`
            : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
});
