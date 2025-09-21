/**
 * ===============================================
 * /api/nowpayments/ipn/route.js
 * - Reads concrete MegaOTT fields from DB
 * - Forwards full payload to subscription route
 * ===============================================
 */
import crypto from 'crypto';
import prisma from '@/lib/core/prisma';
import axios from 'axios';
import { NextResponse } from 'next/server';
// 🔔 Error notifications to socket bridge
import { sendBackendErrorNotification } from '@/lib/notifications/errorNotificationBackend';

export async function POST(request) {
  console.log('🚦 [ipn] IPN webhook received:', new Date().toISOString());

  const rawBody = await request.text();
  const signature = request.headers.get('x-nowpayments-sig');

  const expectedSig = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_KEY)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    console.error('❌ [ipn] Invalid IPN signature!');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }
  console.log('🔏 [ipn] Valid signature for webhook!');

  let body;
  try {
    body = JSON.parse(rawBody);
    console.log('📦 [ipn] Body: ', body);
  } catch (error) {
    console.error('❌ [ipn] JSON parse failed:', error);
    return NextResponse.json({ error: 'Bad Request (body parse failed)' }, { status: 400 });
  }

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

  console.log('🧾 [ipn] Extracted Fields:', {
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

  const paymentId = order_id;
  if (!paymentId) {
    console.error('❌ [ipn] No paymentId (order_id) in IPN');
    return NextResponse.json({ error: 'No paymentId in IPN' }, { status: 400 });
  }

  let paymentRecord;
  try {
    paymentRecord = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
    console.log('🔎 [ipn] Searched by id:', paymentId, 'Found:', !!paymentRecord);
  } catch (error) {
    console.error('❌ [ipn] DB error (find by id):', error);
    return NextResponse.json({ error: 'DB error (find by id)' }, { status: 500 });
  }

  if (!paymentRecord) {
    console.error('❌ [ipn] Payment record not found. id:', paymentId);
    return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
  }

  // 💾 Update payment row with latest NP info (unchanged)
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
        price_currency: price_currency ?? null,
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
      const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
      await axios.post(`${SOCKET_SERVER_URL}/emit/paymentStatusUpdated`, {
        userId: paymentRecord.user_id,
        orderId: paymentRecord.id,
        newStatus: payment_status
      });
      console.log(
        `💾 [ipn] Sent POST /emit/paymentStatusUpdated | userId=${paymentRecord.user_id} | orderId=${paymentRecord.id} | status=${payment_status}`
      );
    }

    console.log('💾 [ipn] Payment updated:', paymentId, '| New Status:', payment_status);
  } catch (error) {
    console.error('❌ [ipn] DB error (update payment):', error);
    return NextResponse.json({ error: 'DB error (update payment)' }, { status: 500 });
  }

  // 👤 Fetch user (strip password)
  let user = null;
  try {
    user = await prisma.user.findUnique({ where: { user_id: paymentRecord.user_id } });
    if (user && user.password) {
      const { password, ...userWithoutPassword } = user;
      user = userWithoutPassword;
    }
    console.log('👤 [ipn] User fetched for payment:', paymentRecord.user_id, '| Found:', !!user);
  } catch (error) {
    console.error('❌ [ipn] DB error (find user):', error);
    return NextResponse.json({ error: 'DB error (find user)' }, { status: 500 });
  }

  // 🧾 Pull everything we need for the MegaOTT hop
  const { user_id, adult, enable_vpn, package_id, max_connections, forced_country } = paymentRecord;
  const { whatsapp, telegram } = user || {};

  // ✅ Create subscription if paid and not already linked
  const latestPayment = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
  if (
    ['confirmed', 'paid', 'completed', 'finished'].includes(payment_status) &&
    !latestPayment.subscription_id
  ) {
    console.log('📢 [ipn] Calling MegaOTT subscription route!!!');
    try {
      const subscriptionCreation = await axios.post(
        `${process.env.NEXTAUTH_URL}/api/megaott/subscription`,
        {
          user_id,
          order_id: paymentRecord.id, // 🧲 anchor
          order_description, // 📝 label
          whatsapp,
          telegram,
          adult: !!adult, // 🔞
          enable_vpn: !!enable_vpn, // 🛡️
          package_id, // 📦 concrete
          max_connections, // 🔢 concrete
          forced_country // 🌍 concrete/default
        },
        { headers: { 'x-megaott-secret': process.env.MEGAOTT_SECRET } }
      );

      console.log('📢 [ipn] MegaOTT subscription route response:', subscriptionCreation.data);

      const { subscription } = subscriptionCreation.data;
      console.log('🎉 [ipn] MegaOtt Subscription created:', subscription);

      await prisma.subscriptionPayment.update({
        where: { id: paymentId },
        data: { subscription_id: subscription.subscription_id }
      });
      console.log('🔗 [ipn] Payment linked to subscription:', {
        paymentId,
        subscription_id: subscription.subscription_id
      });

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
        console.log('📢 [ipn] transactionFinished emitted for:', paymentId);
      } catch (error) {
        console.error('❌ [ipn] Error emitting transactionFinished:', error);
      }
    } catch (error) {
      console.error(
        '❌ [ipn] MegaOTT Subscription Creation failed:',
        error?.response?.data || error
      );
      // 🔔 Notify both admin and user — payment succeeded but subscription didn’t
      try {
        await sendBackendErrorNotification(
          'both',
          {
            user_id: user?.user_id || paymentRecord.user_id,
            name: user?.name || user?.email || 'User'
          },
          'Subscription creation failed after payment',
          // 💬 Exact user-facing message you requested:
          'Payment was processed but the subscription did not get created properly. Please contact the admin through the Live Chat to let them know.',
          JSON.stringify(error?.response?.data || { message: String(error) })
        );
      } catch (notifyErr) {
        // Ensure non-empty block without affecting behavior
        void notifyErr;
      }
      return NextResponse.json({ error: 'MegaOTT subscription creation error' }, { status: 500 });
    }
  } else {
    console.log(
      `⏭️ [ipn] Subscription creation skipped | status: ${payment_status} alreadyLinked: ${!!paymentRecord.subscription_id}`
    );
  }

  console.log('✅ [ipn] IPN processed successfully for id:', paymentId);
  return NextResponse.json({ ok: true }, { status: 200 });
}
