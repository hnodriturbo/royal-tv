/**
 * ===========================================
 * /api/nowpayments/create-invoice/route.js
 * - Uses UUID "id" from subscriptionPayment as anchor (sent as order_id)
 * - Detailed logs for every step
 * ===========================================
 */

import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request) {
  logger.log('➡️ [create-invoice] Request received');
  const user_id = request.headers.get('x-user-id');
  const { package_slug, order_description, price, customer_email } = await request.json();

  if (!user_id || !package_slug || !price || !order_description) {
    logger.warn('⚠️ [create-invoice] Missing required info:', {
      user_id,
      package_slug,
      order_description,
      price
    });
    return NextResponse.json({ error: 'Missing required info' }, { status: 400 });
  }

  // 1. Create payment record in DB, get its unique "id"
  let paymentRecord;
  try {
    paymentRecord = await prisma.subscriptionPayment.create({
      data: {
        user_id,
        status: 'waiting',
        order_description
      }
    });
    logger.log('🆕 [create-invoice] Created DB record:', paymentRecord);
  } catch (error) {
    logger.error('❌ [create-invoice] DB create failed:', error);
    return NextResponse.json({ error: 'Failed to create DB record' }, { status: 500 });
  }

  const paymentId = paymentRecord.id;

  // 2. Create NowPayments invoice using "id" as order_id
  try {
    const invoicePayload = {
      price_amount: price,
      price_currency: 'usd',
      pay_currency: 'btc',
      order_id: paymentId, // Use UUID as anchor
      order_description,
      is_fee_paid_by_user: true,
      ipn_callback_url: 'https://royal-tv.tv/api/nowpayments/ipn',
      customer_email
    };
    logger.log('🌐 [create-invoice] Sending NowPayments payload:', invoicePayload);

    const { data: nowPaymentsData } = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      invoicePayload,
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.log('✅ [create-invoice] NowPayments invoice created:', nowPaymentsData);

    // 3. Update DB record with invoice_id
    await prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: { invoice_id: nowPaymentsData.id }
    });
    logger.log('🔄 [create-invoice] Updated DB record with invoice_id');

    // 4. Respond with everything needed for frontend
    return NextResponse.json({
      id: paymentId,
      iid: nowPaymentsData.id,
      order_id: paymentId,
      widget_url: `https://nowpayments.io/embeds/payment-widget?iid=${nowPaymentsData.id}`,
      payment_status: paymentRecord.status
    });
  } catch (error) {
    logger.error('❌ [create-invoice] NowPayments call failed:', error?.response?.data || error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
