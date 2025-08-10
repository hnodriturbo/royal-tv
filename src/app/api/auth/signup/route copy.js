/**
 *   =========================== route.js ===========================
 * 📝
 * USER REGISTRATION API ROUTE
 * - Registers new user.
 * - Sends admin and user notification (no free trial granted).
 * - Sends admin/user welcome emails.
 * ==================================================================
 */

import logger from '@/lib/core/logger';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/core/prisma.js';

// 📧 Email helpers & templates
import { sendEmailToAdmin } from '@/lib/email/sendEmailToAdmin.js';
import { sendEmailToUser } from '@/lib/email/sendEmailToUser.js';
import { adminNewUserEmail } from 'Storage_Files/emailStorage/adminNewUserEmail.js';
import { userNewUserEmail } from 'Storage_Files/emailStorage/userNewUserEmail.js';

// 🆕 Unified notification system import!
import notificationSystem from '@/constants/notificationSystem.js';

export async function POST(request) {
  // 📥 1️⃣ Get data from request
  const { name, username, email, password, whatsapp, telegram, preferredContactWay } =
    await request.json();

  // ❌ 2️⃣ Check for required fields (return error if missing)
  if (!name || !username || !email || !password || !preferredContactWay) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // 🔒 3️⃣ Hash password for safety
    const hashedPassword = await bcrypt.hash(password, 12);

    // 👤 4️⃣ Create user in database
    const createdUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        whatsapp,
        telegram,
        preferredContactWay,
        role: 'user'
      }
    });

    // 5️⃣ Build notifications first (no double template lookup)
    const adminNotif = notificationSystem.adminNotificationBuilder.newUserRegistration(createdUser);
    const userNotif = notificationSystem.userNotificationBuilder.newUserRegistration(createdUser);

    // 6️⃣ Send emails in parallel: all admins + user (use notification titles)
    const adminUsers = await prisma.user.findMany({ where: { role: 'admin' } });

    // 📧 Prepare all admin emails
    const adminEmailPromises = adminUsers.map((adminUser) =>
      sendEmailToAdmin({
        to: adminUser.email,
        subject: adminNotif.title,
        title: adminNotif.title,
        contentHtml: adminNewUserEmail({ user: createdUser }),
        replyTo: createdUser.email || 'not specified'
      })
    );

    // 📧 Send user welcome email
    const userEmailPromise = sendEmailToUser({
      to: createdUser.email,
      subject: userNotif.title,
      title: userNotif.title,
      contentHtml: userNewUserEmail({ user: createdUser })
    });

    // 🚀 Fire all emails (admins + user) at the same time!
    const results = await Promise.allSettled([...adminEmailPromises, userEmailPromise]);
    // 🔎 Log any failures (optional)
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        if (i < adminUsers.length) {
          logger.error(`⚠️ Admin email failed for ${adminUsers[i].email}:`, result.reason);
        } else {
          logger.error('⚠️ User welcome email failed:', result.reason);
        }
      }
    });

    // 7️⃣ Create ADMIN notifications (all admins get notified)
    for (const adminUser of adminUsers) {
      await prisma.notification.create({
        data: {
          user_id: adminUser.user_id,
          type: adminNotif.type,
          title: adminNotif.title,
          body: adminNotif.body,
          link: adminNotif.link,
          is_read: false
        }
      });
    }

    // 8️⃣ Create USER notification (welcome notification for the user)
    await prisma.notification.create({
      data: {
        user_id: createdUser.user_id,
        type: userNotif.type,
        title: userNotif.title,
        body: userNotif.body,
        link: userNotif.link,
        is_read: false
      }
    });

    // ✅ 9️⃣ Success!
    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
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
