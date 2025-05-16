'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    console.log('[API GET] Fetching profile for user_id:', user_id);

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
        role: true,
        whatsapp: true,
        telegram: true,
        createdAt: true,
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
    console.log('[API PATCH] Updating profile for user_id:', user_id);

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
    console.error('[API PATCH] Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
