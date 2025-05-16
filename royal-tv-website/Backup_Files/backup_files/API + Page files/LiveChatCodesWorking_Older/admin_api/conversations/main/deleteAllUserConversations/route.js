'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    // 🔒 Validate that a user_id was provided
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // 🚨 Delete all messages related to the user's conversations first (cascade handled by Prisma)
    await prisma.supportConversation.deleteMany({
      where: {
        user_id,
      },
    });

    return NextResponse.json(
      { message: 'All user conversations deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ Error deleting user conversations:', error);
    return NextResponse.json(
      { error: 'Failed to delete user conversations' },
      { status: 500 },
    );
  }
}
