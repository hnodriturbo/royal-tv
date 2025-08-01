/**
 *   ======================= route.js ==========================
 * 🎁
 * FREE TRIAL API ROUTE (User Side) — CLEANED
 * - Only creates and returns freeTrial object (+ user object).
 * =============================================================
 */
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ====================== GET: Fetch user's latest free trial ======================
export async function GET(request) {
  try {
    const user_id = request.headers.get('x-user-id');
    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(freeTrial);
  } catch (error) {
    logger.error('🔥 FreeTrial fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ====================== POST: Create new trial, notify, email ======================
export async function POST(request) {
  try {
    const user_id = request.headers.get('x-user-id');
    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    // Prevent double requests
    const existing = await prisma.freeTrial.findFirst({ where: { user_id } });
    if (existing) {
      return NextResponse.json({ error: 'Free trial already requested.' }, { status: 400 });
    }

    // Fetch user info
    const user = await prisma.user.findUnique({ where: { user_id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Create free trial (pending)
    const now = new Date();
    const freeTrial = await prisma.freeTrial.create({
      data: {
        user_id,
        claimedAt: now,
        status: 'pending'
      }
    });

    // ✅ Only return the user and freeTrial objects!
    return NextResponse.json({ freeTrial, user }, { status: 201 });
  } catch (error) {
    logger.error('🔥 FreeTrial POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
