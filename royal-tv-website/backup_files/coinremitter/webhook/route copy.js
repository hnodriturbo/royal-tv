/**
 * ===============================================
 * /api/coinremitter/webhook/route.js
 * - Handles Coinremitter payment webhooks! 🪙
 * - Updates DB only using your Prisma schema. 👑
 * - Emits transactionFinished only.
 * ===============================================
 */

import logger from '@/lib/logger';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // 🚦 Incoming webhook request
  logger.log('🚦 [coinremitter] Webhook received:', new Date().toISOString());

  // 1. Get raw body and signature (if using signatures, optional)
  const rawBody = await request.text();
  const signature = request.headers.get('x-cr-signature'); // Optional

  // 2. (OPTIONAL) Validate signature
  // const expectedSig = crypto
  //   .createHmac('sha256', process.env.COINREMITTER_WEBHOOK_SECRET)
  //   .update(rawBody)
  //   .digest('hex');
  // if (signature && signature !== expectedSig) {
  //   logger.error('❌ [coinremitter] Invalid signature!');
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  // }
  // logger.log('🔏 [coinremitter] Valid signature for webhook!');

  // 3. Parse JSON body
  let body;
  try {
    body = JSON.parse(rawBody);
    // 📦 Log incoming
    logger.log('📦 [coinremitter] Body:', body);
  } catch (error) {
    logger.error('❌ [coinremitter] JSON parse failed:', error);
    return NextResponse.json({ error: 'Bad Request (body parse failed)' }, { status: 400 });
  }

  // 4. Extract relevant fields from Coinremitter webhook
  const {
    invoice_id, // 🔖 Unique invoice from Coinremitter
    status, // 📈 Payment status: 'Pending', 'Paid', etc
    paid_amount, // 💸 Amount paid (float string)
    coin, // 🪙 Coin used (e.g., 'BTC') -> pay_currency
    reference_id, // 🔗 Optional, your custom order/user id
    address // 🏦 Payment address (optional)
    // Add extra fields from Coinremitter here if you want to store them!
  } = body;

  // 5. Use invoice_id as DB anchor
  if (!reference_id) {
    logger.error('❌ [coinremitter] No reference_id in webhook');
    return NextResponse.json({ error: 'No reference_id in webhook' }, { status: 400 });
  }

  // 6. Find payment by invoice_id
  let paymentRecord;
  try {
    paymentRecord = await prisma.subscriptionPayment.findUnique({
      where: { id: reference_id }
    });
    // 🔎 Log search
    logger.log(
      '🔎 [coinremitter] Searched by id: reference_id:',
      reference_id,
      'Found:',
      !!paymentRecord
    );
  } catch (error) {
    logger.error('❌ [coinremitter] DB error (find by invoice_id):', error);
    return NextResponse.json({ error: 'DB error (find by invoice_id)' }, { status: 500 });
  }

  if (!paymentRecord) {
    logger.error('❌ [coinremitter] Payment not found. invoice_id:', invoice_id);
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  // 7. Update payment record (prisma fields ONLY)
  try {
    await prisma.subscriptionPayment.update({
      where: { id: reference_id },
      data: {
        status, // 🔄 Update status
        amount_paid: paid_amount ? parseFloat(paid_amount) : null, // 💸
        pay_currency: coin, // 🪙 Now mapped correctly!
        pay_address: address || null, // 🏦 Address if present
        updatedAt: new Date() // 🕒 Update timestamp
      }
    });
    // 💾 Payment updated
    logger.log('💾 [coinremitter] Payment updated:', invoice_id, '| New Status:', status);
  } catch (error) {
    logger.error('❌ [coinremitter] DB error (update payment):', error);
    return NextResponse.json({ error: 'DB error (update payment)' }, { status: 500 });
  }

  // 8. Fetch user
  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { user_id: paymentRecord.user_id }
    });
    // 👤 User fetched
    logger.log('👤 [coinremitter] User fetched:', paymentRecord.user_id, '| Found:', !!user);
  } catch (error) {
    logger.error('❌ [coinremitter] DB error (find user):', error);
    return NextResponse.json({ error: 'DB error (find user)' }, { status: 500 });
  }

  // 9. Create subscription if payment marked as 'Paid'
  let subscription = null;
  if (status.toLowerCase() === 'paid') {
    try {
      subscription = await prisma.subscription.create({
        data: {
          user_id: paymentRecord.user_id,
          order_id: paymentRecord.order_id || null,
          order_description: paymentRecord.order_description || null,
          status: 'pending',
          payments: { connect: { invoice_id } }
        }
      });
      // 🎉 Subscription created
      logger.log('🎉 [coinremitter] Subscription created:', subscription.subscription_id);

      await prisma.subscriptionPayment.update({
        where: { invoice_id },
        data: { subscription_id: subscription.subscription_id }
      });
      // 🔗 Payment linked to subscription
      logger.log(
        '🔗 [coinremitter] Payment linked to subscription:',
        invoice_id,
        '->',
        subscription.subscription_id
      );

      // Emit event to socket server
      try {
        const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
        await axios.post(`${SOCKET_SERVER_URL}/emit/transactionFinished`, {
          userId: user.user_id,
          user,
          payment: {
            ...paymentRecord,
            status,
            amount_paid: paid_amount ? parseFloat(paid_amount) : null,
            pay_currency: coin
          },
          subscription
        });
        // 📢 Event emitted!
        logger.log('📢 [coinremitter] transactionFinished emitted for:', invoice_id);
      } catch (error) {
        logger.error('❌ [coinremitter] Error emitting transactionFinished:', error);
      }
    } catch (error) {
      logger.error('❌ [coinremitter] DB error (create subscription):', error);
      return NextResponse.json({ error: 'DB error (create subscription)' }, { status: 500 });
    }
  } else {
    // ⏳ Not paid/finished yet
    logger.log('⏳ [coinremitter] Payment not completed, status:', status);
  }

  // ✅ Done!
  logger.log('✅ [coinremitter] Webhook processed for:', invoice_id);
  return NextResponse.json({ ok: true }, { status: 200 });
}
