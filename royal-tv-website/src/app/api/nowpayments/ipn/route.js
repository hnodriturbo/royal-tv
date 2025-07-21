/**
 * ===============================================
 * /api/nowpayments/ipn/route.js
 * -----------------------------------------------
 * Handles NowPayments IPN webhook for Royal TV.
 * - Validates IPN signature.
 * - On first IPN: links payment_id to DB row using invoice_id.
 * - After that: ONLY uses payment_id for lookups.
 * - Updates payment status, creates subscription, emits socket event.
 * ===============================================
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import axios from 'axios';

export async function POST(request) {
  // --- 1. Signature Validation ---
  const rawBody = await request.text();
  const signature = request.headers.get('x-nowpayments-sig');
  const expectedSig = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_KEY)
    .update(rawBody)
    .digest('hex');
  if (signature !== expectedSig) {
    console.error('❌ Invalid IPN signature.');
    return new Response('Invalid signature', { status: 403 });
  }

  // --- 2. Parse and Normalize Payload ---
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const {
    invoice_id: raw_invoice_id,
    payment_id: raw_payment_id,
    payment_status,
    price_amount,
    amount_received: raw_amount_received,
    pay_address,
    pay_currency,
    network
  } = body;

  const invoice_id = String(raw_invoice_id);
  const payment_id = String(raw_payment_id);
  const amount_paid = parseFloat(price_amount);
  const amount_received = raw_amount_received ? parseFloat(raw_amount_received) : null;

  // --- 3. Try to find by payment_id (normal path for all but first IPN) ---
  let paymentRecord = await prisma.subscriptionPayment.findFirst({
    where: { payment_id },
    orderBy: { createdAt: 'desc' }
  });

  // --- 4. If not found, first IPN: match by invoice_id and SET payment_id ---
  if (!paymentRecord) {
    paymentRecord = await prisma.subscriptionPayment.findFirst({
      where: { invoice_id, status: 'waiting' },
      orderBy: { createdAt: 'desc' }
    });
    if (paymentRecord) {
      // Save payment_id for future webhooks!
      await prisma.subscriptionPayment.update({
        where: { id: paymentRecord.id },
        data: { payment_id }
      });
    }
  }

  // --- 5. If still not found, reject ---
  if (!paymentRecord) {
    console.error(
      '❌ Payment record not found. invoice_id:',
      invoice_id,
      'payment_id:',
      payment_id
    );
    return new Response('Payment record not found', { status: 404 });
  }

  // --- 6. Update payment status/fields ---
  await prisma.subscriptionPayment.update({
    where: { id: paymentRecord.id },
    data: {
      payment_id,
      status: payment_status,
      amount_paid,
      amount_received,
      pay_address,
      pay_currency,
      network,
      received_at:
        payment_status === 'finished' || payment_status === 'completed' ? new Date() : undefined
    }
  });

  // --- 7. Fetch User ---
  const user = await prisma.user.findUnique({
    where: { user_id: paymentRecord.user_id }
  });

  // --- 8. Create Subscription & Emit Event if payment is finished or completed ---
  let subscription = null;
  if (payment_status === 'finished' || payment_status === 'completed') {
    subscription = await prisma.subscription.create({
      data: {
        user_id: paymentRecord.user_id,
        order_id: paymentRecord.order_id,
        status: 'pending',
        payments: { connect: { id: paymentRecord.id } }
      }
    });

    await prisma.subscriptionPayment.update({
      where: { id: paymentRecord.id },
      data: { subscription_id: subscription.subscription_id }
    });

    try {
      const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
      await axios.post(`${SOCKET_SERVER_URL}/emit/transactionFinished`, {
        userId: user.user_id,
        user,
        payment: {
          ...paymentRecord,
          payment_id,
          status: payment_status,
          amount_paid,
          amount_received,
          pay_address,
          pay_currency,
          network
        },
        subscription
      });
    } catch (error) {
      console.error('❌ Error sending transactionFinished to socket server:', error);
    }
  }

  return new Response('OK', { status: 200 });
}
