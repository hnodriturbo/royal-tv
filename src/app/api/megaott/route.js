/**
 * POST /api/panel/subscription
 * ----------------------------
 * Body JSON:
 *   • subscription_id: UUID (from Payment)
 *   • user_id:         User making payment
 *   • package_slug:    Which package (e.g. '6m', '6m_extra', '12m', etc)
 *   • order_description: (optional) What to show in panel
 *   • whatsapp, telegram: (optional) contact fields
 *
 * This API is called from IPN after successful payment, and creates
 * the MegaOTT subscription (auto-provisions playlist, etc).
 */

import { NextResponse } from 'next/server';
import { paymentPackages } from '@/packages/data/packages';
import generateRandomUsername from '@/lib/generateUsername';
import axiosInstance from '@/lib/axiosInstance'; // Your pre-authenticated Axios
import prisma from '@/lib/prisma';

export async function POST(request) {
  // 1️⃣ Parse body
  const { subscription_id, user_id, package_slug, order_description, whatsapp } =
    await request.json();

  // 2️⃣ Find package info
  const pack = paymentPackages.find((pkg) => pkg.slug === package_slug);
  if (!pack) return NextResponse.json({ error: 'Unknown package' }, { status: 400 });

  // 3️⃣ Build API request for MegaOTT
  const username = generateRandomUsername();

  const form = new URLSearchParams({
    type: 'M3U',
    username,
    package_id: String(pack.package_id),
    max_connections: String(pack.devices),
    forced_country: 'ALL',
    adult: '0',
    note: order_description || pack.order_description,
    whatsapp_telegram: whatsapp || '',
    enable_vpn: String(pack.enable_vpn ?? 0),
    paid: pack.paid ? '1' : '0'
  });

  // 4️⃣ Call MegaOTT API
  const { data: res } = await axiosInstance.post('https://megaott.net/api/v1/subscriptions', form, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.MEGAOTT_API_KEY}`
    }
  });
  console.log(`Data Received from megaott: ${res}`);

  // 5️⃣ Update your Subscription in DB
  await prisma.subscription.update({
    where: { subscription_id },
    data: {
      provider_subscription_id: res.id,
      username: res.username,
      password: res.password,
      package_id: res.package.id,
      devices: res.max_connections,
      dns_link: res.dns_link,
      dns_link_for_samsung_lg: res.dns_link_for_samsung_lg,
      portal_link: res.portal_link,
      status: 'active',
      note: res.note,
      startDate: new Date(),
      endDate: res.expiring_at ? new Date(res.expiring_at) : null
    }
  });

  // 6️⃣ Return the details for UI or logs
  return NextResponse.json({ subscription: res }, { status: 201 });
}
