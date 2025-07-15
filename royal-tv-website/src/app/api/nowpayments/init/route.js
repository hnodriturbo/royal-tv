/**
 * ==============================================
 * /api/nowpayments/init/route.js
 * ----------------------------------------------
 * Creates a pending SubscriptionPayment record
 *  - Requires user_id from x-user-id header
 *  - Uses order_id and invoice_id from body
 * ==============================================
 */

import prisma from '@/lib/prisma';

export async function POST(request) {
  const user_id = request.headers.get('x-user-id');
  const { order_id, invoice_id } = await request.json();

  if (!user_id) {
    console.error('❌ Missing x-user-id header!');
    return new Response('Unauthorized', { status: 401 });
  }

  if (!order_id || !invoice_id) {
    console.error('❌ Missing order_id or invoice_id in request body!');
    return new Response('Bad Request', { status: 400 });
  }

  // 🔑 Create the pending payment record
  await prisma.subscriptionPayment.create({
    data: {
      user_id,
      order_id,
      invoice_id,
      status: 'waiting'
    }
  });

  console.log(`✅ Init payment: user ${user_id}, order ${order_id}, invoice ${invoice_id}`);

  return new Response('Payment initialized', { status: 201 });
}
