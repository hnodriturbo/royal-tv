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

import { NextResponse } from 'next/server';
import generateRandomUsername from '@/lib/generateUsername';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import util from 'util';

export async function POST(request) {
  // 📌 Set the user_id from headers
  const user_id = request.headers.get('x-user-id');
  console.log('got user id from request headers from middleware x-user-id: ', user_id);
  // 🛡️ Check for user role in headers
  const role = request.headers.get('x-user-role');

  console.log('got user role from request headers from middleware x-user-role: ', role);
  if (role !== 'user') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // 📨 Parse all fields from the frontend
  /*   const formData = await request.json();
  const { ...trialFields } = formData; */

  // 🛡️ Check for existing active trial for user
  /*   const existing = await prisma.freeTrial.findFirst({
    where: { user_id }
  }); */

  // 🧠 Only 1 trial is allowd per user so is user has already asked for a trial he cannot ask for another one
  /*   if (existing) {
    // 🚫 Only one active trial per user
    return NextResponse.json(
      { error: 'You already have requested a free trial !' },
      { status: 409 }
    );
  } */

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
    username: generateRandomUsername(),
    package_id: '2', // 📦 Always use Free Trial 2 as requested
    type: 'M3U',
    max_connections: '1',
    forced_country: 'ALL',
    adult: '0',
    note: '1 Day Free Trial',
    enable_vpn: '0',
    paid: '0'
    /* ...trialFields */ // 🚦 Frontend fields override any of the above if provided!
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
    console.log('🚀 MegaOTT trial created:', res);
  } catch (error) {
    // 🔴 MegaOTT API error!
    console.log('❌ MegaOTT error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }

  // 5️⃣ Save the trial to your local database
  try {
    const trial = await prisma.freeTrial.create({
      data: {
        user_id,
        megaott_id: res.id || null,
        username: res.username || null,
        password: res.password || null,
        mac_address: res.mac_address || null,
        package_id: res.package?.id || null,
        package_name: res.package?.name || null,
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
    console.log('Saved trial to database:', trial);
    console.log('Saved trial to database:\n' + JSON.stringify(trial, null, 2));

    console.log('Saved trial →', util.inspect(trial, { depth: null, colors: true }));
  } catch (error) {
    console.log(error.message);
  }

  // 6️⃣ Respond to frontend with trial info
  return NextResponse.json({ trial: res }, { status: 201 });
}
