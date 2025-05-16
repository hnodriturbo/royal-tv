'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const user_id = req.headers.get('User-ID'); // ✅ Read user_id from headers

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required in headers' },
        { status: 400 },
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

export async function PATCH(req) {
  try {
    const { user_id, name, email, username, whatsapp, telegram } =
      await req.json();

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
    console.error('[API PATCH] Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
