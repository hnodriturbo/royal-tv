'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(req) {
  try {
    const { user_id, oldPassword, newPassword } = await req.json();

    if (!user_id || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { user_id } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Incorrect old password' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { user_id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[API PUT] Error updating password:', error);
    return NextResponse.json(
      { error: `internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}
