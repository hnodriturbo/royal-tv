import prisma from '@/lib/prisma';
import axios from 'axios';

export async function POST(request) {
  const user_id = request.headers.get('x-user-id');
  const { order_id, package_name, price, customer_email } = await request.json();

  if (!user_id || !order_id || !package_name || !price) {
    return new Response('Missing required info', { status: 400 });
  }

  try {
    // 1. Create invoice
    const { data } = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount: price,
        price_currency: 'usd',
        pay_currency: 'btc',
        order_description: package_name,
        is_fee_paid_by_user: true,
        ipn_callback_url: 'https://royal-tv.tv/api/nowpayments/ipn',
        customer_email
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Data: ', data);

    // 2. Save payment record with invoice_id (iid)
    await prisma.subscriptionPayment.create({
      data: {
        user_id,
        order_id,
        invoice_id: data.id, // The new iid
        status: 'waiting'
      }
    });

    // 3. Respond with the widget URL for the frontend
    return Response.json({
      widget_url: `https://nowpayments.io/embeds/payment-widget?iid=${data.id}`
    });
  } catch (error) {
    console.error('❌ Failed to create invoice:', error?.response?.data || error);
    return new Response('Failed to create invoice', { status: 500 });
  }
}
