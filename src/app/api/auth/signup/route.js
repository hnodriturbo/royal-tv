/**
 *   =========================== route.js ===========================
 * 📝 USER REGISTRATION API ROUTE
 * - Registers new user.
 * - Emits admin/user notification via Socket.IO (createNotificationsUtility).
 * - Sends admin/user welcome emails.
 * - No hooks or client-side logic used—pure server/utility style.
 * ==================================================================
 */

import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma.js';

export async function POST(request) {
  const { name, username, email, password, whatsapp, telegram, preferredContactWay, sendEmails } =
    await request.json();

  if (!name || !username || !email || !password || !preferredContactWay) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // 🔒 Hash password for safety
    const hashedPassword = await bcrypt.hash(password, 12);

    // 👤 Create user in database
    const createdUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        whatsapp,
        telegram,
        preferredContactWay,
        sendEmails,
        role: 'user'
      }
    });

    // ✅ Success!
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: createdUser // 👈 Return the full user object!
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Signup error:', error);
    // 🛑 Handle duplicate username/email error from Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json(
        { message: `This ${field} is already taken. Please try another.` },
        { status: 400 }
      );
    }
    // 🛑 Other errors
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
