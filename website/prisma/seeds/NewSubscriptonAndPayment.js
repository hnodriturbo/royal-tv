/**
 * scripts/createFakeSubscriptionAndNotification.js
 * =================================================
 * 🎯 Purpose
 * - Create a fake 3-month subscription + a $30 USD BTC payment
 * - Insert a notification that links to the created subscription_id
 * - Useful to validate translations & notification rendering
 *
 * 🧩 Data sources
 * - Reads existing user by user_id
 *
 * 🛡️ Notes
 * - Keeps notification title/body in English (DB source of truth)
 * - Packs localization-friendly `data` for your notificationSystem
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
/* const prisma = new PrismaClient(); */

// 🔢 Utilities
import crypto from 'crypto';

// 🧰 Prisma instance
const prisma = new PrismaClient();

// 🧑‍💼 Target user (provided)
const targetUserId = '0038bb49-5d65-423a-a55c-445c064dccc8';

// 🔧 Tiny helpers
const randomHex = (len = 8) => crypto.randomBytes(len).toString('hex'); // 🎲 random string
const nowUtc = () => new Date(); // 🕒 now
const addDays = (baseDate, days) => new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000); // ➕ days

(async function main() {
  // 🚦 safety wrapper for clean exit
  try {
    // 👤 fetch the user (fail fast if missing)
    const existingUser = await prisma.user.findUnique({
      where: { user_id: targetUserId }
    });

    if (!existingUser) {
      console.error('❌ No user found with user_id:', targetUserId);
      process.exit(1);
    }

    // 🧮 derive dates and numbers
    const createdAt = nowUtc(); // 🕒 creation timestamp
    const expiresAt = addDays(createdAt, 90); // 📅 3 months ~ 90 days (simple demo)
    const amountUsd = 30; // 💵 USD price
    const payCurrency = 'BTC'; // ₿ payment currency
    const priceCurrency = 'USD'; // 💲 pricing currency
    const simulatedBtcAmount = Number((0.0005 + Math.random() * 0.0009).toFixed(8)); // 🧮 fake BTC paid

    // 🧾 order + identifiers
    const orderId = `FAKE-${Date.now()}-${randomHex(4)}`; // 🧾 unique-ish order id
    const invoiceId = `INV-${randomHex(6)}`; // 🧾 invoice mimic
    const paymentId = `PAY-${randomHex(6)}`; // 💳 payment mimic
    const purchaseId = `PUR-${randomHex(6)}`; // 🛒 purchase mimic

    // 🔐 optional subscription credentials (purely fake)
    const generatedUsername = `user_${randomHex(4)}`; // 👤 fake username
    const generatedPassword = randomHex(6); // 🔑 fake password

    // 📦 package & plan
    const packageId = 101; // 📦 example pkg id
    const maxConnections = 1; // 🔗 limit
    const packageName = 'Standard 3 Months'; // 🏷️ human label

    // 🛰️ DNS/portal placeholders
    const dnsLink = `dns://${randomHex(3)}.royaltv.example`;
    const dnsLinkSamsungLg = `dns://${randomHex(3)}.samsunglg.example`;
    const portalLink = `http://portal.${randomHex(3)}.royaltv.example`;

    // 🧾 subscription row (paid + active)
    const createdSubscription = await prisma.subscription.create({
      data: {
        user_id: existingUser.user_id,
        order_id: orderId,
        order_description: '3-month subscription, paid via BTC',
        megaott_id: null, // 🛰️ not binding to real provider in this fake
        username: generatedUsername,
        password: generatedPassword,
        mac_address: null,
        package_id: packageId,
        package_name: packageName,
        template: 'MAG',
        max_connections: maxConnections,
        forced_country: 'ALL',
        adult: false,
        enable_vpn: false,
        note: 'Fake seed subscription for QA/testing notifications',
        whatsapp_telegram: null,
        paid: true,
        expiring_at: expiresAt,
        dns_link: dnsLink,
        dns_link_for_samsung_lg: dnsLinkSamsungLg,
        portal_link: portalLink,
        status: 'active' // ✅ assumes SubscriptionStatus has 'active'
      }
    });

    // 💳 payment row (completed)
    const createdPayment = await prisma.subscriptionPayment.create({
      data: {
        user_id: existingUser.user_id,
        subscription_id: createdSubscription.subscription_id,
        package_slug: 'standard-3mo',
        adult: false,
        enable_vpn: false,
        package_id: packageId,
        max_connections: maxConnections,
        template_id: 0,
        forced_country: 'ALL',
        payment_id: paymentId,
        purchase_id: purchaseId,
        invoice_id: invoiceId,
        order_id: orderId,
        order_description: '3-month subscription, paid via BTC',
        pay_address: `${randomHex(16)}${randomHex(16)}`, // 🏦 fake address-like
        pay_currency: payCurrency, // ₿ BTC in
        pay_amount: simulatedBtcAmount, // 🧮 BTC amount to pay
        price_currency: priceCurrency, // 💲 USD pricing
        amount_paid: amountUsd, // 💵 logical USD amount paid
        actually_paid: simulatedBtcAmount, // 🪙 actual BTC paid
        outcome_amount: simulatedBtcAmount, // 🔄 same for simple demo
        outcome_currency: 'BTC', // 🔄 settlement in BTC
        network: 'bitcoin', // 🌐 network tag
        received_at: createdAt, // 🕒 pretend received now
        status: 'completed' // ✅ assumes PaymentStatus has 'completed'
      }
    });

    // 🔔 notification (DB stores English, i18n uses `data` for rendering)
    const createdNotification = await prisma.notification.create({
      data: {
        user_id: existingUser.user_id,
        title: 'Subscription created',
        body: `A 3-month subscription was created and paid ($${amountUsd} USD via BTC).`,
        link: createdSubscription.subscription_id, // 🔗 open-content navigates by subscription_id
        type: 'subscription', // 🏷️ assumes NotificationType has 'subscription'
        event: 'created', // 🧩 sub-event
        for_admin: false,
        data: {
          // 🧩 rich template data for localization rendering
          templateKey: 'subscription.created',
          months: 3,
          priceUSD: amountUsd,
          payCurrency: payCurrency,
          packageName: packageName,
          orderId: orderId,
          invoiceId: invoiceId,
          paymentId: paymentId,
          subscriptionId: createdSubscription.subscription_id,
          user: {
            user_id: existingUser.user_id,
            email: existingUser.email ?? null,
            displayName: existingUser.name ?? existingUser.username ?? existingUser.email ?? 'User'
          },
          // 🗂️ optional extras your renderer may or may not use
          payment: {
            amountBTC: simulatedBtcAmount,
            network: 'bitcoin',
            status: 'completed'
          },
          subscription: {
            status: 'active',
            expiringAtISO: expiresAt.toISOString()
          }
        }
      }
    });

    // 📣 pretty output for quick sanity check
    console.log('✅ Created Subscription:', {
      subscription_id: createdSubscription.subscription_id,
      order_id: createdSubscription.order_id,
      status: createdSubscription.status,
      expiring_at: createdSubscription.expiring_at?.toISOString()
    });

    console.log('✅ Created Payment:', {
      id: createdPayment.id,
      status: createdPayment.status,
      pay_currency: createdPayment.pay_currency,
      price_currency: createdPayment.price_currency,
      amount_paid_usd: createdPayment.amount_paid,
      actually_paid_btc: createdPayment.actually_paid
    });

    console.log('✅ Created Notification:', {
      notification_id: createdNotification.notification_id,
      type: createdNotification.type,
      event: createdNotification.event,
      link_subscription_id: createdNotification.link
    });

    // 🧭 Tip: your UI "Open content" should navigate using the link (subscription_id).
  } catch (error) {
    // 🚨 plain English logs only (per your rule)
    console.error('Failed to create fake subscription/payment/notification:', error);
    process.exit(1);
  } finally {
    // 🧹 always disconnect Prisma
    await prisma.$disconnect();
  }
})();
