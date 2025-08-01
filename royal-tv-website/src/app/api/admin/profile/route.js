import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const user_id = request.headers.get('x-user-id');
    const user_role = request.headers.get('x-user-role');
    if (!user_id) {
      return NextResponse.json({ error: 'User ID not found!' }, { status: 401 });
    }
    if (user_role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an admin for this path to work' },
        { status: 401 }
      );
    }

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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error('[API GET] Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user_id = request.headers.get('x-user-id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID not found!' }, { status: 401 });
    }
    // PATCH
    const { name, email, username, whatsapp, telegram, preferredContactWay, sendEmails } =
      await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required in the request body' },
        { status: 400 }
      );
    }

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
    logger.error('[API PATCH] Error updating profile:', error.message);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? `Internal Server Error: ${error.message}` // 🧪 Show full message in dev
            : 'Internal Server Error' // 🔐 Hide it in production
      },
      { status: 500 }
    );
  }
}
