import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { user_id, widget_id, order_description, amount } = await request.json();

  if (!user_id || !widget_id || !order_description || !amount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // 💾 Store the Coinremitter widget ID for analytics/reference (not as order_id!)
  const payment = await prisma.subscriptionPayment.create({
    data: {
      user_id,
      order_description,
      status: 'waiting',
      amount_paid: parseFloat(amount),
      pay_currency: 'BTC',
      widget_id // Save as widget_id (not order_id!)
    }
  });

  // Return payment.id to use as order_id for Coinremitter!
  return NextResponse.json({ paymentId: payment.id });
}
