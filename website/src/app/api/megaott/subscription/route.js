/**
 * POST /api/megaott/subscription
 * ==============================
 * 🎬 Idempotent: creates ONE local subscription per order_id.
 * 🚫 No mapping here — expects concrete MegaOTT fields in the body.
 *
 * Body JSON:
 *   • user_id: string
 *   • order_id: string
 *   • order_description: string
 *   • package_id: number
 *   • max_connections: number
 *   • forced_country?: string (default 'ALL')
 *   • adult?: boolean
 *   • enable_vpn?: boolean
 *   • whatsapp?: string
 *   • telegram?: string
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import generateRandomUsername from '@/lib/utils/generateUsername';
import { sendBackendErrorNotification } from '@/lib/notifications/errorNotificationBackend';

export async function POST(request) {
  let user_id; // 🌎 declare early so try & catch can both access it
  try {
    // 🔐 Optional guard
    const providedSecret = request.headers.get('x-megaott-secret');
    if (providedSecret !== process.env.MEGAOTT_SECRET) {
      console.error('🚫 [megaott/subscription] Not authorized (bad x-megaott-secret)');
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const {
      user_id: parsedUserId,
      order_id,
      order_description,
      package_id,
      max_connections,
      forced_country = 'ALL',
      adult = false,
      enable_vpn = false,
      whatsapp,
      telegram
    } = await request.json();

    user_id = parsedUserId;

    // 🧪 Validate
    if (!user_id || !order_id || !package_id || !max_connections) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, order_id, package_id, max_connections' },
        { status: 400 }
      );
    }

    // ♻️ Idempotency: return existing if same order_id
    const existing = await prisma.subscription.findFirst({ where: { order_id } });
    if (existing) {
      console.log(
        `♻️ [megaott/subscription] Reusing existing subscription for order_id=${order_id}`
      );
      return NextResponse.json({ ok: true, idempotent: true, subscription: existing });
    }

    // 👤 Username
    const generatedUsername = generateRandomUsername();

    // 📡 MegaOTT payload
    const megaottPayload = {
      type: 'M3U',
      username: generatedUsername,
      package_id,
      max_connections,
      forced_country,
      adult: adult ? 1 : 0,
      enable_vpn: enable_vpn ? 1 : 0,
      note: order_description || null,
      whatsapp_telegram: [whatsapp, telegram].filter(Boolean).join(' / ') || null,
      paid: 1
    };

    console.log('📡 [megaott/subscription] Sending payload to MegaOTT:', megaottPayload);

    // 🍪 Session + request
    const cookieJar = new CookieJar();
    const axiosWithCookies = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));
    const bearer = process.env.MEGAOTT_API_KEY;

    await axiosWithCookies.get('https://megaott.net/api/v1/user', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${bearer}`,
        'User-Agent': 'Mozilla/5.0',
        Origin: 'https://megaott.net'
      }
    });
    console.log('🍪 [megaott/subscription] Session cookies acquired.');

    // 🚀 Attempt create
    let megaottResponseData = null;
    try {
      const createRes = await axiosWithCookies.post(
        'https://megaott.net/api/v1/subscriptions',
        megaottPayload,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${bearer}`,
            'Content-Type': 'application/json'
          }
        }
      );
      megaottResponseData = createRes.data;
    } catch (megaErr) {
      megaottResponseData = megaErr?.response?.data || {
        type: 'error',
        title: 'error',
        message: megaErr?.message || 'MegaOTT creation failed'
      };
    }

    console.log('✅ [megaott/subscription] MegaOTT response:', megaottResponseData);

    // ⚠️ If MegaOTT said "error", notify both right away (payment already confirmed at this point)
    if (megaottResponseData?.type === 'error') {
      try {
        await sendBackendErrorNotification(
          'both',
          { user_id },
          'Subscription creation failed after payment',
          'Payment was processed but the subscription did not get created properly. Please contact the admin through the Live Chat to let them know.',
          JSON.stringify(megaottResponseData)
        );
      } catch (err) {
        // Ensure non-empty block without affecting behavior
        void err;
      }
    }

    // 💾 Save exactly one local row
    const saved = await prisma.subscription.create({
      data: {
        user_id,
        order_id,
        megaott_id: megaottResponseData?.id ?? null,
        username: megaottResponseData?.username ?? null,
        password: megaottResponseData?.password ?? null,
        mac_address: megaottResponseData?.mac_address ?? null,
        package_id: megaottResponseData?.package?.id ?? package_id,
        package_name: megaottResponseData?.package?.name ?? null,
        template: megaottResponseData?.template ?? null, // we never send template_id
        max_connections: megaottResponseData?.max_connections ?? max_connections,
        forced_country: megaottResponseData?.forced_country ?? forced_country,
        adult: megaottResponseData?.adult === true ? true : !!adult,
        enable_vpn: !!enable_vpn,
        note: megaottResponseData?.note ?? (order_description || null),
        whatsapp_telegram:
          megaottResponseData?.whatsapp_telegram ??
          ([whatsapp, telegram].filter(Boolean).join(' / ') || null),
        paid: megaottResponseData?.paid === true,
        expiring_at: megaottResponseData?.expiring_at
          ? new Date(megaottResponseData.expiring_at)
          : null,
        dns_link: megaottResponseData?.dns_link ?? null,
        dns_link_for_samsung_lg: megaottResponseData?.dns_link_for_samsung_lg ?? null,
        portal_link: megaottResponseData?.portal_link ?? null,
        status: 'active'
      }
    });

    console.log('🎉 [megaott/subscription] Subscription saved:', saved);
    return NextResponse.json({ ok: true, idempotent: false, subscription: saved });
  } catch (error) {
    console.error('❌ [megaott/subscription] Fatal error:', error?.response?.data || error);

    // 🚨 Fatal failure — notify both
    try {
      await sendBackendErrorNotification(
        'both',
        { user_id }, // ✅ use the one you already parsed
        'Subscription creation failed after payment',
        'Payment was processed but the subscription did not get created properly. Please contact the admin through the Live Chat to let them know.',
        JSON.stringify(error?.response?.data || { message: String(error) })
      );
    } catch (notifyErr) {
      // Ensure non-empty block without affecting behavior
      void notifyErr;
    }

    return NextResponse.json(
      { error: 'MegaOTT subscription creation error', detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
