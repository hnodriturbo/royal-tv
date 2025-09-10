
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import bcrypt from 'bcryptjs';
import { withRole, getUserId } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = withRole('admin', async (request, _ctx, session) => {
  try {
    const user_id = getUserId(session);
    if (!user_id) return NextResponse.json({ error: 'No user in session' }, { status: 401 });

    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { user_id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Incorrect old password' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { user_id }, data: { password: hashedPassword } });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[API PUT] Error updating password:', error);
    return NextResponse.json({ error: `internal server error: ${error.message}` }, { status: 500 });
  }
});
