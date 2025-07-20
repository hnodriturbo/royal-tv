/**
 * ===============================================
 * /api/nowpayments/ipn/route.js
 * -----------------------------------------------
 * Handles NowPayments IPN webhook for Royal TV.
 * - Validates IPN signature
 * - Updates payment status in DB
 * - Creates subscription if payment is finished
 * - Emits a real-time transactionFinished event to socket server (for this user only)
 *   → Frontend buyNow page listens for this event,
 *     then triggers both user and admin notifications.
 * ===============================================
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import axios from 'axios'; // For direct POST to socket server HTTP endpoint

export async function POST(request) {
  // 📨 Get raw body for signature validation
  const rawBody = await request.text();
  const signature = request.headers.get('x-nowpayments-sig');

  // 🔏 Compute HMAC for IPN security
  const expectedSig = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_KEY)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    // 🛑 Invalid signature
    console.error('❌ Invalid IPN signature.');
    return new Response('Invalid signature', { status: 403 });
  }

  // 📦 Parse the payload
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // 🧾 Extract fields from payload
  const {
    invoice_id,
    payment_id,
    payment_status,
    price_amount,
    amount_received,
    pay_address,
    pay_currency,
    network
  } = body;

  // 🔍 Find the pending payment by invoice_id
  const paymentRecord = await prisma.subscriptionPayment.findFirst({
    where: { invoice_id, status: 'waiting' },
    orderBy: { createdAt: 'desc' }
  });

  if (!paymentRecord) {
    console.error('❌ Payment record not found for invoice:', invoice_id);
    return new Response('Payment record not found', { status: 404 });
  }

  // 📝 Update payment details immediately
  await prisma.subscriptionPayment.update({
    where: { id: paymentRecord.id },
    data: {
      payment_id,
      status: payment_status,
      amount_paid: parseFloat(price_amount),
      amount_received: parseFloat(amount_received),
      pay_address,
      pay_currency,
      network,
      received_at: payment_status === 'finished' ? new Date() : undefined
    }
  });

  let subscription = null;

  // 👤 Fetch the user for merging into socket payload
  const user = await prisma.user.findUnique({
    where: { user_id: paymentRecord.user_id }
  });

  /*   // 💸 Fetch the updated payment record
  const updatedPayment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentRecord.id }
  }); */

  // 🚀 If payment is finished, create subscription & emit real-time event for user
  if (payment_status === 'finished') {
    // 1️⃣ Create subscription
    subscription = await prisma.subscription.create({
      data: {
        user_id: paymentRecord.user_id,
        order_id: paymentRecord.order_id,
        status: 'pending',
        payments: { connect: { id: paymentRecord.id } }
      }
    });

    // 2️⃣ Link payment to subscription
    await prisma.subscriptionPayment.update({
      where: { id: paymentRecord.id },
      data: { subscription_id: subscription.subscription_id }
    });

    // 💡 Fetch the updated payment record AGAIN, NOW with subscription_id!
    const updatedPayment = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentRecord.id }
    });

    // 3️⃣ 🔔 Emit transactionFinished event for this user (via socket server HTTP bridge)
    try {
      const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
      console.log(
        '[IPN] About to POST to Socket Server:',
        `${SOCKET_SERVER_URL}/emit/transactionFinished`
      );
      console.log('[IPN] Payload:', {
        userId: user.user_id,
        user,
        payment: updatedPayment,
        subscription
      });

      const socketResponse = await axios.post(`${SOCKET_SERVER_URL}/emit/transactionFinished`, {
        userId: user.user_id,
        user,
        payment: updatedPayment,
        subscription
      });
      console.log('[IPN] Socket server response:', socketResponse.data);
    } catch (error) {
      console.error('❌ Error sending transactionFinished to socket server:', error);
    }

    console.log(`🎉 Subscription created for user ${paymentRecord.user_id}`);
  }

  return new Response('OK', { status: 200 });
}
