'use server';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@lib/prisma';

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID not provided' },
        { status: 400 },
      );
    }

    const { oldPassword, newPassword, confirmPassword } = await request.json();

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 },
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { user_id } });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Old password is incorrect.' },
        { status: 403 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { user_id },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { message: 'Password updated successfully.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Password PUT] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 },
    );
  }
}
