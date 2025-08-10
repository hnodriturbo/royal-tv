/**
 * POST /api/megaott/freeTrial
 * ---------------------------
 * Automatically creates a real free trial on MegaOTT.
 * Handles cookies/XSRF just like Postman/browser.
 *
 * Body JSON: {
 *   user_id: string,
 *   ...all other MegaOTT trial fields (see below)
 * }
 *
 * Creates only one active free trial per user.
 */
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import axios from 'axios';
import generateRandomUsername from '@/lib/generateUsername';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // 📌 Extract user ID and role from middleware
  const user_id = request.headers.get('x-user-id');
  const user_role = request.headers.get('x-user-role');

  // 🛡️ Only allow if a real user is making the request
  if (!user_id || user_role !== 'user') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      whatsapp: true,
      telegram: true
    }
  });

  // 🛑 If not found, return 404
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 🛡️ Check for existing active trial for user
  const existing = await prisma.freeTrial.findFirst({
    where: { user_id }
  });

  // 🧠 Only 1 trial is allowd per user so is user has already asked for a trial he cannot ask for another one
  if (existing) {
    // 🚫 Only one active trial per user
    return NextResponse.json(
      { error: 'You already have requested a free trial !' },
      { status: 409 }
    );
  }

  // 🍪 Setup cookie jar + axios client
  const cookieJar = new CookieJar();
  const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));

  // 🔑 Your MegaOTT API key (Bearer token)
  const megaott_api_key = process.env.MEGAOTT_API_KEY;

  // 1️⃣ Get cookies/session by calling /user with Bearer
  await client.get('https://megaott.net/api/v1/user', {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0',
      Origin: 'https://megaott.net',
      Authorization: `Bearer ${megaott_api_key}`
    }
  });

  // 2️⃣ Build the payload for MegaOTT (merge defaults + frontend fields)
  const payload = {
    // 👤 Always generate a unique username for the trial!
    type: 'M3U',
    username: generateRandomUsername(),
    package_id: '2', // 📦 Always use Free Trial 2 (That is one day free trial)
    max_connections: '1',
    forced_country: 'ALL',
    adult: '0',
    note: `24 Hour Free Trial`,
    enable_vpn: '0',
    paid: '1',
    whatsapp_telegram: [user?.whatsapp, user?.telegram].filter(Boolean).join(' / ')
  };

  // 3️⃣ Build x-www-form-urlencoded body
  const form = new URLSearchParams(payload);

  // 4️⃣ Create the free trial on MegaOTT
  let res;
  try {
    const response = await client.post('https://megaott.net/api/v1/subscriptions', form, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${megaott_api_key}`,
        'User-Agent': 'Mozilla/5.0',
        Origin: 'https://megaott.net',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    res = response.data;
    // 🟢 Successfully created trial!
    logger.log('🚀 MegaOTT trial created:', res);
  } catch (error) {
    // 🔴 MegaOTT API error!
    logger.log('❌ MegaOTT error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }

  // 5️⃣ Save the trial to your local database
  let trial;
  try {
    trial = await prisma.freeTrial.create({
      data: {
        user_id,
        megaott_id: res.id || null,
        username: res.username || null,
        password: res.password || null,
        mac_address: res.mac_address || null,
        package_id: res.package?.id || null,
        package_name: 'Free Trial For 24H' || null,
        template: res.template || null,
        max_connections: res.max_connections ?? null,
        forced_country: res.forced_country || null,
        adult: typeof res.adult === 'boolean' ? res.adult : null,
        note: res.note || null,
        whatsapp_telegram: res.whatsapp_telegram || null,
        paid: typeof res.paid === 'boolean' ? res.paid : null,
        expiring_at: res.expiring_at ? new Date(res.expiring_at) : null,
        dns_link: res.dns_link || null,
        dns_link_for_samsung_lg: res.dns_link_for_samsung_lg || null,
        portal_link: res.portal_link || null
      }
    });
    logger.log('Saved Trial To Database: ', JSON.stringify(trial, null, 2));
  } catch (error) {
    logger.log(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5.5️⃣ Fetch the full user object (safe fields only!)
  let fullUser;
  try {
    fullUser = await prisma.user.findUnique({
      where: { user_id },
      // Select only safe fields you want to send to the frontend!
      select: {
        user_id: true,
        name: true,
        email: true,
        whatsapp: true,
        telegram: true
        // add more if needed, but never send password, etc!
      }
    });
  } catch (error) {
    logger.log(error.message);
    fullUser = null;
  }

  // 6️⃣ Respond to frontend with trial info AND user
  return NextResponse.json({ user: fullUser, trial }, { status: 201 });
}
