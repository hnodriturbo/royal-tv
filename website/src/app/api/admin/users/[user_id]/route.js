/**
 * ========== /app/api/admin/users/[user_id]/route.js ==========
 * 🔒 ADMIN USER ITEM API (Server)
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const safeUserSelect = {
  user_id: true,
  username: true,
  name: true,
  email: true,
  role: true,
  whatsapp: true,
  telegram: true,
  createdAt: true
};

const allowedUpdateKeys = new Set(['username', 'name', 'email', 'role', 'whatsapp', 'telegram']);

function getUserIdFromCtx(ctx) {
  const raw = ctx?.params?.user_id;
  return typeof raw === 'string' ? decodeURIComponent(raw) : null;
}

export const GET = withRole('admin', async (request, ctx) => {
  const user_id = getUserIdFromCtx(ctx);
  console.log('[API][Admin][User][GET] Fetching user', { user_id });

  if (!user_id) {
    return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { user_id }, select: safeUserSelect });
    if (!user) {
      console.log('[API][Admin][User][GET] Not found', { user_id });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('[API][Admin][User][GET] Failed', { error: error?.message || error });
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
  }
});

export const PATCH = withRole('admin', async (request, ctx) => {
  const user_id = getUserIdFromCtx(ctx);
  console.log('[API][Admin][User][PATCH] Incoming', { user_id });

  if (!user_id) {
    return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
  }

  let parsedBody = null;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const safeData = Object.fromEntries(
    Object.entries(parsedBody || {}).filter(([k]) => allowedUpdateKeys.has(k))
  );

  if (!Object.keys(safeData).length) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { user_id },
      data: safeData,
      select: safeUserSelect
    });
    console.log('[API][Admin][User][PATCH] Updated', { user_id });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('[API][Admin][User][PATCH] Failed', { error: error?.message || error });
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
});

export const DELETE = withRole('admin', async (_request, ctx) => {
  const user_id = getUserIdFromCtx(ctx);
  console.log('[API][Admin][User][DELETE] Incoming', { user_id });

  if (!user_id) {
    return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { user_id } });
    console.log('[API][Admin][User][DELETE] Deleted', { user_id });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API][Admin][User][DELETE] Failed', { error: error?.message || error });
    // FK violation friendly message
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete user with related records (subscriptions/logs/etc.)' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
});
