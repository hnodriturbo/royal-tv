// /app/api/admin/subscriptions/route.js
'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              user_id: true,
            },
          },
        },
      }),
      prisma.subscription.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      subscriptions,
      totalPages,
    });
  } catch (error) {
    console.error('🔥 Admin Subscriptions API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
