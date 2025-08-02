/**
 * ===============================================
 * /api/nowpayments/ipn/route.js
 * - Milestone logs kept, one-line per action! 👀
 * ===============================================
 */

import logger from '@/lib/logger';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // 🚦 Incoming request
  logger.log('🚦 [ipn] IPN webhook received:', new Date().toISOString());

  // 1. Get raw body and signature
  const rawBody = await request.text();
  const signature = request.headers.get('x-nowpayments-sig');

  // 2. Compute expected signature
  const expectedSig = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_KEY)
    .update(rawBody)
    .digest('hex');

  // 3. Validate signature
  if (signature !== expectedSig) {
    logger.error('❌ [ipn] Invalid IPN signature!');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }
  logger.log('🔏 [ipn] Valid signature for webhook!');

  // 4. Parse body
  let body;
  try {
    body = JSON.parse(rawBody);
    // 📦 Log incoming summary
    logger.log('📦 [ipn] Body: ', body);
  } catch (error) {
    logger.error('❌ [ipn] JSON parse failed:', error);
    return NextResponse.json({ error: 'Bad Request (body parse failed)' }, { status: 400 });
  }

  // 5. Extract fields
  const {
    payment_id,
    payment_status,
    price_amount,
    price_currency,
    actually_paid,
    pay_address,
    pay_currency,
    pay_amount,
    outcome_amount,
    outcome_currency,
    network,
    order_id,
    order_description,
    invoice_id,
    purchase_id
  } = body;
  // 🧾 Log the extracted/aliased fields your code uses
  logger.log('🧾 [ipn] Extracted Fields:', {
    payment_id,
    payment_status,
    price_amount,
    price_currency,
    actually_paid,
    pay_address,
    pay_currency,
    pay_amount,
    outcome_amount,
    outcome_currency,
    network,
    order_id,
    order_description,
    invoice_id,
    purchase_id
  });

  // 6. Use order_id as DB anchor
  const paymentId = order_id;
  if (!paymentId) {
    logger.error('❌ [ipn] No paymentId (order_id) in IPN');
    return NextResponse.json({ error: 'No paymentId in IPN' }, { status: 400 });
  }

  // 7. Find payment record by id
  let paymentRecord;
  try {
    paymentRecord = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentId }
    });
    // 🔎 Searched by id
    logger.log('🔎 [ipn] Searched by id:', paymentId, 'Found:', !!paymentRecord);
  } catch (error) {
    logger.error('❌ [ipn] DB error (find by id):', error);
    return NextResponse.json({ error: 'DB error (find by id)' }, { status: 500 });
  }

  if (!paymentRecord) {
    logger.error('❌ [ipn] Payment record not found. id:', paymentId);
    return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
  }

  // 8. Update payment record
  try {
    await prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        payment_id: payment_id ? String(payment_id) : null,
        purchase_id: purchase_id ?? null,
        invoice_id: invoice_id ? String(invoice_id) : null,
        order_id: order_id ?? null,
        order_description: order_description ?? null,
        status: payment_status,
        amount_paid: parseFloat(price_amount),
        price_currency: price_currency ?? null, // 💰 ADD THIS
        actually_paid: actually_paid ? parseFloat(actually_paid) : null,
        pay_address: pay_address ?? null,
        pay_currency: pay_currency ?? null,
        pay_amount: pay_amount ? parseFloat(pay_amount) : null,
        outcome_amount: outcome_amount ? parseFloat(outcome_amount) : null,
        outcome_currency: outcome_currency ?? null,
        network: network ?? pay_currency ?? 'btc',
        received_at:
          paymentRecord.received_at ||
          (['confirmed', 'paid', 'completed', 'finished'].includes(payment_status)
            ? new Date()
            : undefined)
      }
    });
    const alreadyFinished =
      paymentRecord.subscription_id &&
      ['confirmed', 'paid', 'completed', 'finished'].includes(paymentRecord.status);

    if (!alreadyFinished) {
      // Send socket update through socketServer bridge
      const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
      await axios.post(`${SOCKET_SERVER_URL}/emit/paymentStatusUpdated`, {
        userId: paymentRecord.user_id,
        orderId: paymentRecord.id,
        newStatus: payment_status
      });
      logger.log(
        `💾 [ipn] Sent POST request to /emit/paymentStatusUpdated | userId: ${paymentRecord.user_id} | orderId: ${paymentRecord.id} | New Status:, ${payment_status}`
      );
    }
    // 💾 Payment updated
    logger.log('💾 [ipn] Payment updated:', paymentId, '| New Status:', payment_status);
  } catch (error) {
    logger.error('❌ [ipn] DB error (update payment):', error);
    return NextResponse.json({ error: 'DB error (update payment)' }, { status: 500 });
  }

  // 9. Fetch user and strip password field 🛡️
  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { user_id: paymentRecord.user_id }
    });
    // ✂️ Remove password property if present
    if (user && user.password) {
      const { password, ...userWithoutPassword } = user;
      user = userWithoutPassword;
    }
    // 👤 User fetched for payment — password never sent!
    logger.log('👤 [ipn] User fetched for payment:', paymentRecord.user_id, '| Found:', !!user);
  } catch (error) {
    // ❌ DB error (find user)
    logger.error('❌ [ipn] DB error (find user):', error);
    return NextResponse.json({ error: 'DB error (find user)' }, { status: 500 });
  }

  // Extract useful fields from payment and user
  const { user_id, package_slug, order_description: stored_order_description } = paymentRecord;
  const { whatsapp, telegram } = user || {};

  // 10. Create subscription if payment status is valid AND not already created ✅
  let subscription = null;
  const latestPayment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId }
  });
  if (
    ['confirmed', 'paid', 'completed', 'finished'].includes(payment_status) &&
    !latestPayment.subscription_id
  ) {
    try {
      subscription = await prisma.subscription.create({
        data: {
          user_id,
          order_id: paymentRecord.id,
          order_description: stored_order_description,
          status: 'pending',
          payments: { connect: { id: paymentId } }
        }
      });
      // 🎉 Subscription created
      logger.log('🎉 [ipn] Subscription created:', subscription.subscription_id);

      await prisma.subscriptionPayment.update({
        where: { id: paymentId },
        data: { subscription_id: subscription.subscription_id }
      });
      // 🔗 Payment linked to subscription
      logger.log(
        '🔗 [ipn] Payment linked to subscription:',
        paymentId,
        '->',
        subscription.subscription_id
      );

      // Emit event to socket server
      try {
        const updatedPayment = await prisma.subscriptionPayment.findUnique({
          where: { id: paymentId }
        });
        const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
        await axios.post(`${SOCKET_SERVER_URL}/emit/transactionFinished`, {
          userId: user.user_id,
          user,
          payment: updatedPayment,
          subscription
        });
        // 📢 Transaction event sent
        logger.log('📢 [ipn] transactionFinished emitted for:', paymentId);

        // 🔥 Call the panel API sync
        const subscriptionCreation = await axios.post('/api/megaott/subscription', {
          subscription_id: subscription.subscription_id,
          user_id,
          package_slug,
          order_description,
          whatsapp,
          telegram
        });
        // 📢 POST sent to the megaott subscription creator
        logger.log(
          '📢 [ipn] POST sent to the megaott subscription creator /panel/subscription/route.js:',
          subscriptionCreation
        );
      } catch (error) {
        logger.error('❌ [ipn] Error emitting transactionFinished:', error);
      }
    } catch (error) {
      logger.error('❌ [ipn] DB error (create subscription):', error);
      return NextResponse.json({ error: 'DB error (create subscription)' }, { status: 500 });
    }
  } else {
    logger.log(
      `⏭️ [ipn] Subscription creation skipped | status: ${payment_status} alreadyLinked to subscription: ${!!paymentRecord.subscription_id}`
    );
  }

  // ✅ Done!
  logger.log('✅ [ipn] IPN processed successfully for id:', paymentId);
  return NextResponse.json({ ok: true }, { status: 200 });
}
