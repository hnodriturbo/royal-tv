/**
 * Royal TV — MegaOTT Subscription Creation 🎬
 * ===========================================
 * Automatically called from IPN after successful payment.
 *
 * Responsibilities:
 *   • Maps local package_slug to MegaOTT's package_id & template.
 *   • Generates unique username.
 *   • Calls MegaOTT API to create subscription.
 *   • Saves Subscription details locally in DB.
 *
 * Expects (JSON Body):
 *   • user_id              (UUID)
 *   • package_slug         (string)
 *   • order_id             (string, unique from payment)
 *   • order_description    (string)
 *   • whatsapp, telegram   (optional)
 *   • adult                (boolean, optional)
 *
 * Returns:
 *   • subscription database record (MegaOTT subscription)
 * ===========================================
 */

import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import axios from 'axios';
import generateRandomUsername from '@/lib/generateUsername';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { paymentPackages } from '@/packages/data/packages';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 📌 Extract user from middleware headers (security check)
    const user_id = request.headers.get('x-user-id');
    const role = request.headers.get('x-user-role');

    if (role !== 'user') {
      logger.error('🚫 Unauthorized access attempt:', { user_id, role });
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // 📨 Get required data from IPN webhook
    const { package_slug, order_id, order_description, whatsapp, telegram, adult, enable_vpn } =
      await request.json();

    logger.log('📥 [megaott/subscription] Received data from IPN:', {
      user_id,
      package_slug,
      order_id,
      order_description,
      whatsapp,
      telegram,
      adult,
      enable_vpn
    });

    // 🔍 Get MegaOTT package details from slug clearly
    const packageDetails = paymentPackages.find((p) => p.slug === package_slug);
    if (!packageDetails) {
      logger.error('🚫 Package slug not found:', package_slug);
      return NextResponse.json({ error: 'Invalid package_slug' }, { status: 400 });
    }

    // 🔐 Generate unique username for subscription
    const username = generateRandomUsername();

    // 📝 Prepare MegaOTT API payload
    const megaottPayload = {
      type: 'M3U',
      username,
      package_id: packageDetails.package_id, // ✅ crucial ID
      max_connections: packageDetails.devices,
      template_id: packageDetails.megaTemplateId || null, // Adjust if template is used
      forced_country: 'ALL',
      adult: adult ? 1 : 0, // ✅ boolean to 1/0
      enable_vpn: enable_vpn ? 1 : 0, // ✅ boolean to 1/0
      note: order_description,
      whatsapp_telegram: [user?.whatsapp, user?.telegram].filter(Boolean).join(' / '),
      paid: 1
    };

    logger.log('📡 [megaott/subscription] Sending payload to MegaOTT:', megaottPayload);

    // 🌐 MegaOTT API call setup
    const apiKey = process.env.MEGAOTT_API_KEY;
    const cookieJar = new CookieJar();
    const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));

    // 🍪 Acquire session cookies from MegaOTT
    await client.get('https://megaott.net/api/v1/user', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0',
        Origin: 'https://megaott.net'
      }
    });

    logger.log('🍪 [megaott/subscription] Session cookies acquired.');

    // 🌐 Send POST request to MegaOTT for subscription creation
    const megaottRes = await client.post(
      'https://megaott.net/api/v1/subscriptions',
      megaottPayload,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const megaottResponse = megaottRes.data;
    logger.log('✅ [megaott/subscription] MegaOTT response:', megaottResponse);

    // 🎯 Clearly save MegaOTT subscription details locally
    const subscription = await prisma.subscription.create({
      data: {
        user_id,
        order_id,
        megaott_id: megaottResponse.id,
        username: megaottResponse.username,
        password: megaottResponse.password,
        mac_address: megaottResponse.mac_address,
        package_id: megaottResponse.package?.id,
        package_name: megaottResponse.package?.name,
        template: megaottResponse.template,
        max_connections: megaottResponse.max_connections,
        forced_country: megaottResponse.forced_country || 'ALL',
        adult: megaottResponse.adult,
        note: megaottResponse.note,
        whatsapp_telegram: megaottResponse.whatsapp_telegram,
        paid: megaottResponse.paid,
        expiring_at: megaottResponse.expiring_at ? new Date(megaottResponse.expiring_at) : null,
        dns_link: megaottResponse.dns_link,
        dns_link_for_samsung_lg: megaottResponse.dns_link_for_samsung_lg,
        portal_link: megaottResponse.portal_link,
        status: 'pending'
      }
    });

    logger.log('🎉 [megaott/subscription] Subscription created locally:', subscription);

    // 🚀 Return the subscription clearly to IPN webhook
    return NextResponse.json({ ok: true, subscription });
  } catch (err) {
    logger.error('❌ [megaott/subscription] Error:', err?.response?.data || err.message);
    return NextResponse.json(
      {
        error: 'MegaOTT subscription creation error',
        detail: err?.response?.data || err.message
      },
      { status: 500 }
    );
  }
}
