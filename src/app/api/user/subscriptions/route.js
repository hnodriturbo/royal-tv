// /app/api/user/subscriptions/route.js
'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const user_id = req.headers.get('User-ID');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // ✅ Fetch subscriptions for that user
    const subscriptions = await prisma.subscription.findMany({
      where: { user_id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('🔥 Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
