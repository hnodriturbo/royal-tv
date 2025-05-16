'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
/* import { getToken } from 'next-auth/jwt'; */
import { auth } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = await auth(request); // ✅ correct usage
    console.log('token on the backend: ', token);
    const user_id = token?.user_id;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    if (!user_id) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID not found in token' },
        { status: 401 },
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[API GET] Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { user_id, name, email, username, whatsapp, telegram } =
      await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required in the request body' },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { user_id },
      data: { name, email, username, whatsapp, telegram },
      select: {
        user_id: true,
        name: true,
        email: true,
        username: true,
        whatsapp: true,
        telegram: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[API PATCH] Error updating profile:', error.message);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? `Internal Server Error: ${error.message}` // 🧪 Show full message in dev
            : 'Internal Server Error', // 🔐 Hide it in production
      },
      { status: 500 },
    );
  }
}
