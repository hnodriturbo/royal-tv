// /app/api/admin/subscriptions/[subscription_id]/notify-active/route.js
'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmailToUser } from '@/lib/email/sendEmailToUser';

export async function POST(req, { params }) {
  try {
    const { subscription_id } = params;

    const subscription = await prisma.subscription.findUnique({
      where: { subscription_id },
      include: {
        user: true,
      },
    });

    if (!subscription || !subscription.user) {
      return NextResponse.json(
        { error: 'Subscription or user not found' },
        { status: 404 },
      );
    }

    const emailHtml = `
      <h2>🎉 Subscription Activated!</h2>
      <p>Your <strong>${subscription.plan}</strong> plan is now active.</p>
      <p>You can now log in and view your IPTV credentials and details.</p>
    `;

    await sendEmailToUser(
      subscription.user.email,
      emailHtml,
      '✅ Your Subscription is Active',
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔥 Notify Active Email Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
