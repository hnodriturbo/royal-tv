import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(request) {
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

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

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

  // ✅ Find latest waiting payment with invoice_id
  const paymentRecord = await prisma.subscriptionPayment.findFirst({
    where: { invoice_id, status: 'waiting' },
    orderBy: { createdAt: 'desc' } // latest entry
  });

  if (!paymentRecord) {
    console.error('❌ Payment record not found for invoice:', invoice_id);
    return new Response('Payment record not found', { status: 404 });
  }

  // ✅ Update payment immediately
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

  // ✅ If payment complete, create subscription
  if (payment_status === 'finished') {
    const subscription = await prisma.subscription.create({
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

    console.log(`🎉 Subscription created for user ${paymentRecord.user_id}`);
  }

  return new Response('OK', { status: 200 });
}
