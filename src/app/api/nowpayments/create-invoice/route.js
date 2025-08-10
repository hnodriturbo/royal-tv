/**
 * ===========================================
 * /api/nowpayments/create-invoice/route.js
 * - Uses UUID "id" as order_id
 * - Persists ALL user choices for IPN hop
 * ===========================================
 */

import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request) {
  logger.log('➡️ [create-invoice] Request received');

  // 👤 Who is buying (middleware injected)
  const user_id = request.headers.get('x-user-id');

  // 📥 Incoming JSON
  const {
    package_slug, // 🏷️ still useful
    order_description, // 📝 label
    price, // 💵 amount
    customer_email, // 📧

    // 🔞 & 🛡️ flags
    adult = false,
    enable_vpn = false,

    // 🧱 concrete MegaOTT fields — no mapping later
    package_id,
    max_connections,
    forced_country = 'ALL'
  } = await request.json();

  // ✅ Validate must-haves (we removed template_id entirely)
  if (
    !user_id ||
    !package_slug ||
    !price ||
    !order_description ||
    !package_id ||
    !max_connections
  ) {
    logger.warn('⚠️ [create-invoice] Missing required info:', {
      user_id,
      package_slug,
      order_description,
      price,
      package_id,
      max_connections
    });
    return NextResponse.json({ error: 'Missing required info' }, { status: 400 });
  }

  // 1) 💾 Create payment row (persist everything IPN needs)
  let paymentRecord;
  try {
    paymentRecord = await prisma.subscriptionPayment.create({
      data: {
        user_id,
        package_slug,
        status: 'waiting',
        order_description,

        // toggles
        adult,
        enable_vpn,

        // concrete params
        package_id,
        max_connections,
        forced_country
      }
    });
    logger.log('🆕 [create-invoice] Created DB record:', paymentRecord);
  } catch (error) {
    logger.error('❌ [create-invoice] DB create failed:', error);
    return NextResponse.json({ error: 'Failed to create DB record' }, { status: 500 });
  }

  const paymentId = paymentRecord.id;

  // 2) 🌐 Create NowPayments invoice
  try {
    const invoicePayload = {
      price_amount: price,
      price_currency: 'usd',
      pay_currency: 'btc',
      order_id: paymentId, // 🧲 anchor for IPN
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

    await prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: { invoice_id: nowPaymentsData.id }
    });
    logger.log('🔄 [create-invoice] Updated DB record with invoice_id');

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
