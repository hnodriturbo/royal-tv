// 📁 File: /api/payment/ipn/route.js
'use server';

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sendEmailToAdmin } from '@/lib/email/sendEmailToAdmin';
import { sendEmailToUser } from '@/lib/email/sendEmailToUser';

import { adminNewPaymentEmail } from '@/lib/email/premade/adminSubcriptionPaymentEmail';
import { userNewPaymentEmail } from '@/lib/email/premade/userSubscriptionPaymentEmail';

export async function POST(request) {
  const logPrefix = () => `[IPN ${new Date().toISOString()}]`;
  try {
    // ── 1. Read & log raw body ─────────────────────────────────────────────
    const rawBody = await request.text();
    console.debug(logPrefix(), '🐛 Raw IPN payload:', rawBody);

    // ── 2. Verify signature ──────────────────────────────────────────────
    const signature = request.headers.get('x-nowpayments-sig');
    const expectedSig = crypto
      .createHmac('sha512', process.env.NOWPAYMENTS_IPN_KEY)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSig) {
      console.error(logPrefix(), '❌ Invalid IPN signature', {
        signature,
        expectedSig,
      });
      return new Response('Invalid signature', { status: 403 });
    }
    console.log(logPrefix(), '🔒 Signature validated');

    // ── 3. Parse JSON ────────────────────────────────────────────────────
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log(logPrefix(), '✅ IPN parsed', body);
    } catch (parseErr) {
      console.error(logPrefix(), '❌ Failed to parse IPN JSON:', parseErr);
      return new Response('Bad Request', { status: 400 });
    }

    const {
      payment_id,
      payment_status,
      pay_address,
      price_amount,
      price_currency,
      pay_currency,
      amount_received,
      order_id,
      invoice_id,
      network,
    } = body;

    // ── 4. Authenticate user ───────────────────────────────────────────────
    const session = await auth(request);
    if (!session?.user?.user_id) {
      console.error(
        logPrefix(),
        '❌ Unauthorized IPN call – no user in session',
      );
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = session.user.user_id;

    // ── 5. Lookup user in DB ──────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) {
      console.error(logPrefix(), `❌ User not found in DB: ${userId}`);
      return new Response('User not found', { status: 404 });
    }
    console.log(
      logPrefix(),
      `👤 IPN belongs to user: ${user.email} (${userId})`,
    );

    // ── 6. Upsert payment record ──────────────────────────────────────────
    const paymentRecord = await prisma.subscriptionPayment.upsert({
      where: { invoice_id },
      update: {
        status: payment_status,
        amount_paid: parseFloat(price_amount),
        amount_received: amount_received ? parseFloat(amount_received) : null,
      },
      create: {
        user_id: userId,
        payment_id,
        order_id,
        invoice_id,
        status: payment_status,
        currency: price_currency,
        amount_paid: parseFloat(price_amount),
        amount_received: amount_received ? parseFloat(amount_received) : null,
        pay_currency,
        pay_address,
        network,
      },
    });
    console.log(
      logPrefix(),
      `✅ Upserted payment: ${payment_id}`,
      paymentRecord,
    );

    // ── 7. Handle successful payment ──────────────────────────────────────
    if (payment_status === 'finished') {
      // 7a. Notify Admin
      try {
        await sendEmailToAdmin({
          subject: `💸 New Subscription - ${order_id}`,
          title: 'New Subscription Payment',
          contentHtml: adminNewPaymentEmail({
            user,
            plan: order_id,
            payment_id,
            invoice_id,
            price_amount,
            price_currency,
          }),
          replyTo: user.email,
          includeSignature: true,
        });
        console.log(logPrefix(), `📨 Admin notified for payment ${payment_id}`);
      } catch (emailErr) {
        console.error(logPrefix(), `⚠️ Failed to email admin:`, emailErr);
      }

      // 7b. Notify User
      try {
        await sendEmailToUser({
          to: user.email,
          subject: '✅ Subscription Payment Received',
          title: 'Thank you for your payment!',
          contentHtml: userNewPaymentEmail({ plan: order_id }),
          replyTo: 'support@royal-tv.tv',
        });
        console.log(logPrefix(), `📧 User notified of payment ${payment_id}`);
      } catch (emailErr) {
        console.error(logPrefix(), `⚠️ Failed to email user:`, emailErr);
      }

      // 7c. Create subscription
      try {
        const subscription = await prisma.subscription.findFirst({
          where: { user_id: userId, plan: order_id },
        });
        if (!subscription) {
          const newSub = await prisma.subscription.create({
            data: {
              user_id: userId,
              plan: order_id,
              status: 'pending',
            },
          });
          console.log(
            logPrefix(),
            `✅ Subscription created: ${newSub.subscription_id} for plan ${order_id}`,
          );
        } else {
          console.log(
            logPrefix(),
            `ℹ️ Subscription already exists for plan ${order_id}`,
          );
        }
      } catch (dbErr) {
        console.error(logPrefix(), `⚠️ Failed to create subscription:`, dbErr);
      }
    }

    // ── 8. Respond OK ─────────────────────────────────────────────────────
    console.log(
      logPrefix(),
      `🏁 IPN processing complete for payment ${payment_id}`,
    );
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error(logPrefix(), '🔥 Uncaught IPN handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
