import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Import the send email to admin on new user registration
import { sendEmailToAdmin } from '@/lib/email/sendEmailToAdmin';
import { sendEmailToUser } from '@/lib/email/sendEmailToUser';
import { adminNewUserEmail } from '@/lib/email/premade/adminNewUserEmail';
import { userNewUserEmail } from '@/lib/email/premade/userNewUserEmail';

export async function POST(request) {
  const {
    name,
    username,
    email,
    password,
    whatsapp,
    telegram,
    preferredContactWay,
  } = await request.json();

  if (!name || !username || !email || !password || !preferredContactWay) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        whatsapp,
        telegram,
        preferredContactWay,
        role: 'user',
      },
    });

    // 📨 Try to notify the admin & user but swallow any errors
    // fire both emails in parallel and handle results
    const [adminResult, userResult] = await Promise.allSettled([
      sendEmailToAdmin({
        subject: `💸 New User Registration`,
        title: 'New User Registration',
        contentHtml: adminNewUserEmail({ user }),
        replyTo: user.email || 'not specified',
      }),
      sendEmailToUser({
        to: user.email,
        subject: 'Welcome To Royal IPTV Services',
        title: 'Welcome!',
        contentHtml: userNewUserEmail({ user }),
      }),
    ]);

    if (adminResult.status === 'rejected') {
      console.error('⚠️ Admin email failed:', adminResult.reason);
    }
    if (userResult.status === 'rejected') {
      console.error('⚠️ Welcome email failed:', userResult.reason);
    }

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
