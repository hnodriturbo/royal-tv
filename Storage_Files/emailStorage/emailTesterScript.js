// 🚀 scripts/testEmails.js
// A quick script to send test emails for every flow in lib/email
// — with the correct layout wrapper applied to user emails!

import logger from '@/lib/core/logger.js';
import dotenv from 'dotenv';
dotenv.config(); // 🔑 load SMTP creds from your .env

// 📦 import the two senders from the lib/email folder
import { sendEmailToAdmin } from '../../src/lib/email/sendEmailToAdmin.js';
import { sendEmailToUser } from '../../src/lib/email/sendEmailToUser.js';

// ✉️ import each HTML-content factory from lib/email/premade
import { newUserAdminEmail } from './adminNewUserEmail.js';
import { adminNewPaymentEmail } from './adminSubcriptionPaymentEmail.js';
import { userNewUserEmail } from './userNewUserEmail.js';
import { userNewPaymentEmail } from './userSubscriptionPaymentEmail.js';

// 📋 Test data
const user = {
  user_id: 'u_12345',
  username: 'johndoe',
  name: 'John Doe',
  email: 'support@royal-tv.tv',
  telegram: '@johndoe',
  whatsapp: '+447911123456',
  preferredContactWay: 'telegram'
};

const testPlan = 'Premium';
const testPaymentId = 'pay_abc123';
const testInvoiceId = 'inv_xyz789';
const testAmount = 19.99;
const testCurrency = 'USD';

async function runTests() {
  try {
    // 1️⃣ Admin: New User Registration
    await sendEmailToAdmin({
      subject: `💸 New User Registration`,
      title: 'New User Registration',
      contentHtml: newUserAdminEmail({ user }),
      replyTo: user.email || 'not specified'
    }),
      logger.log('✅ Sent admin welcome email (with layout)');

    // User: Welcome / New Registration
    await sendEmailToUser({
      to: user.email,
      subject: 'Welcome To Royal IPTV Services',
      title: 'Welcome!',
      contentHtml: userNewUserEmail({ user })
    }),
      logger.log('✅ Sent user welcome email (with layout)');

    // Admin: Subscription Payment
    await sendEmailToAdmin({
      subject: `💸[TEST] Subscription payment received`,
      title: '[TEST] New Payment Received',
      contentHtml: adminNewPaymentEmail({
        user: user.name,
        plan: testPlan,
        payment_id: testPaymentId,
        invoice_id: testInvoiceId,
        price_amount: testAmount,
        price_currency: testCurrency
      }),
      replyTo: user.email || 'not specified'
    }),
      logger.log('✅ Sent admin subscription-payment email');

    // 4️⃣ User: Payment Confirmation
    await sendEmailToUser({
      to: user.email,
      subject: '[TEST] Your subscription is confirmed',
      title: '💳 Subscription Confirmed',
      contentHtml: userNewPaymentEmail({ plan: testPlan }),
      includeSignature: true
    });
    logger.log('✅ Sent user payment-confirmation email (with layout)');
  } catch (err) {
    logger.error('❌ Error sending test emails:', err);
  } finally {
    process.exit(0);
  }
}

runTests();
