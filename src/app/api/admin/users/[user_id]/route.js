'use server';

import logger from '@/lib/core/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';

/*
 * GET /api/admin/users/[user_id]
 * - Retrieves details for a specific user by user_id (excluding sensitive fields like password).
 */
export async function GET(request, { params }) {
  // Extract user_id from the dynamic route params
  const { user_id } = await params;
  logger.log('[API GET] Fetching user with user_id:', user_id);

  try {
    // Find the user by user_id and select only non-sensitive fields
    const user = await prisma.user.findUnique({
      where: { user_id }, // user_id is a UUID string
      select: {
        user_id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        whatsapp: true,
        telegram: true,
        createdAt: true
      }
    });

    if (!user) {
      logger.log('[API GET] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    logger.log('[API GET] Found user:', user);
    return NextResponse.json(user);
  } catch (error) {
    logger.error('[API GET] Error fetching user:', error);
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
  }
}

/*
 * PATCH /api/admin/users/[user_id]
 * - Updates details for a specific user.
 * - Expects a JSON body with fields to update (e.g., name, username, email, role, whatsapp, telegram).
 */
export async function PATCH(request, { params }) {
  const { user_id } = params;
  logger.log('[API PATCH] Updating user with user_id:', user_id);

  try {
    const body = await request.json();
    logger.log('[API PATCH] Received update data:', body);

    // Update the user with provided fields and return the updated record
    const updatedUser = await prisma.user.update({
      where: { user_id },
      data: body,
      select: {
        user_id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        whatsapp: true,
        telegram: true,
        createdAt: true
      }
    });

    logger.log('[API PATCH] Updated user:', updatedUser);
    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('[API PATCH] Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

/*
 * DELETE /api/admin/users/[user_id]
 * - Deletes a specific user by user_id.
 */
export async function DELETE(request, { params }) {
  const { user_id } = params;
  logger.log('[API DELETE] Deleting user with user_id:', user_id);

  try {
    await prisma.user.delete({
      where: { user_id }
    });
    logger.log('[API DELETE] User deleted successfully');
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('[API DELETE] Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
