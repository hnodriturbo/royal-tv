import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 👇 Replace with your user_id if needed, or fetch dynamically!
  const subscription_id = '065ea4bf-f6cc-41f8-9457-edeb706f04d4';

  // Get subscription to link the user
  const sub = await prisma.subscription.findUnique({
    where: { subscription_id }
  });
  if (!sub) throw new Error('Subscription not found!');

  // Use the same user_id as the subscription for valid foreign key
  const user_id = sub.user_id;

  // 🪙 Create a payment
  const payment = await prisma.subscriptionPayment.create({
    data: {
      user_id,
      subscription_id,
      payment_id: 'PAY-123456',
      purchase_id: 'PURCHASE-987654',
      invoice_id: 'INV-9999',
      order_id: 'ORDER-5555',
      pay_address: 'bc1qexampleaddressfortesting',
      pay_currency: 'BTC',
      pay_amount: 0.00025,
      price_currency: 'USD',
      amount_paid: 0.00025,
      actually_paid: 0.00025,
      outcome_amount: 17.3,
      outcome_currency: 'USD',
      network: 'bitcoin',
      received_at: new Date(),
      status: 'confirmed', // or "pending" | "failed" | etc.
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log('✅ Payment created:', payment);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
