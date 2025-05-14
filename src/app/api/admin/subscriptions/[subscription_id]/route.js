// /app/api/admin/subscriptions/[subscription_id]/route.js
'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { subscription_id } = params;

    const subscription = await prisma.subscription.findUnique({
      where: { subscription_id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            whatsapp: true,
            telegram: true,
            user_id: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('🔥 Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
