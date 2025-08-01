import prisma from '@/lib/prisma';
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // 📬 Always return 200 for Coinremitter (even on error)
  try {
    // 📦 Parse the raw body (webhook is sent as text)
    let rawBody = await request.text();
    let body = JSON.parse(rawBody);
    console.log('📦 [coinremitter] Webhook body:', body);

    // 🪄 Normalize the payload
    const eventData = body.data || body;

    // 🏷️ Extract payment id/reference (created earlier in /create-invoice)
    const reference_id = eventData.order_id || eventData.reference_id || null;
    if (!reference_id) {
      // ❌ No payment reference? Nothing to do!
      console.warn('⚠️ [coinremitter] No reference/order_id in webhook');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 🔎 Find the payment (must exist, created by /create-invoice)
    let paymentRecord = await prisma.subscriptionPayment.findUnique({
      where: { id: reference_id }
    });

    if (!paymentRecord) {
      // ❌ Payment does not exist, do NOT create (must always be pre-created)
      console.warn('⚠️ [coinremitter] Payment not found in DB:', reference_id);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 🏷️ Grab/normalize fields for update
    const status = eventData.status || eventData.order_status || null;
    const paid_amount = eventData.paid_crypto_amount || eventData.amount || null;
    const coin = eventData.coin_symbol || eventData.coin || null;
    const address = eventData.address || null;
    const invoice_id = eventData.invoice_id || null;

    // 💾 Update payment info
    await prisma.subscriptionPayment.update({
      where: { id: reference_id },
      data: {
        status: status ? status.toLowerCase() : null,
        amount_paid: paid_amount ? parseFloat(paid_amount) : null,
        pay_currency: coin || null,
        pay_address: address || null,
        invoice_id: invoice_id || null,
        updatedAt: new Date()
      }
    });
    console.log('💾 [coinremitter] Payment updated:', reference_id, status);

    // 🔄 Refetch updated payment
    const updatedPayment = await prisma.subscriptionPayment.findUnique({
      where: { id: reference_id }
    });

    // 👤 Find user (by user_id, already set at creation)
    let user = null;
    if (updatedPayment.user_id) {
      user = await prisma.user.findUnique({
        where: { user_id: updatedPayment.user_id }
      });
    }

    // ✅ If payment is complete and no subscription exists, create it!
    const isComplete = ['paid', 'finished', 'completed', 'success'].includes(updatedPayment.status);

    if (
      isComplete &&
      !updatedPayment.subscription_id // Only one subscription per payment!
    ) {
      try {
        // 🆕 Create subscription and link payment
        const subscription = await prisma.subscription.create({
          data: {
            user_id: updatedPayment.user_id,
            order_id: updatedPayment.id,
            order_description: updatedPayment.order_description,
            status: 'pending', // Can adjust your default logic here!
            payments: { connect: { id: updatedPayment.id } }
          }
        });

        // 🔗 Link subscription_id in payment
        await prisma.subscriptionPayment.update({
          where: { id: updatedPayment.id },
          data: { subscription_id: subscription.subscription_id }
        });

        // 📣 Emit transactionFinished to socket server (so frontend gets notified)
        try {
          const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
          await axios.post(`${SOCKET_SERVER_URL}/emit/transactionFinished`, {
            userId: user?.user_id,
            user,
            payment: {
              ...updatedPayment
            },
            subscription
          });
          console.log('📢 [coinremitter] transactionFinished emitted for:', invoice_id);
        } catch (error) {
          console.error('❌ [coinremitter] Socket emit failed:', error);
        }
      } catch (error) {
        console.error('❌ [coinremitter] Subscription creation failed:', error);
        // Return 200 anyway for Coinremitter
      }
    } else {
      // 💤 Not completed or already linked to subscription
      console.log(
        '⏳ [coinremitter] Payment not yet complete or already linked:',
        updatedPayment.status
      );
    }

    // 🎉 Done, always return 200 OK
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    // 🛑 Error in webhook handling, log but always return 200
    console.error('❌ [coinremitter] Webhook error:', error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
