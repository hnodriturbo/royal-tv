'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function GET(request, { params }) {
  const { user_id } = params;

  try {
    const conversations = await prisma.conversation.findMany({
      where: { user_id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}
