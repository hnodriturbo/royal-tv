/**
 * ================================================
 * POST /api/panel/subscribe
 * Royal TV — Provider Panel API Sync 🎬
 * ================================================
 * Called automatically after payment is confirmed and a Subscription is created.
 *
 * Responsibilities:
 *   • Maps local package slug to external provider's package_id and template_id
 *   • Generates a unique username for every new subscription
 *   • Calls the provider (Panel) API to create the subscription
 *   • Saves PanelSubscription info to the database and links it to Subscription
 *
 * Expects:
 *   • subscription_id      (UUID, local subscription)
 *   • user_id              (UUID, owner)
 *   • package_slug         (string, matches your internal package slug)
 *   • order_description    (string, user-friendly name)
 *   • whatsapp, telegram   (optional, for contact info)
 *
 * Returns:
 *   • PanelSubscription database record (linked to Subscription)
 * ================================================
 */

import prisma from '@/lib/prisma';
import axios from 'axios';
import { getPanelPackageInfo } from '@/lib/panelPackageMap';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 📨 Parse JSON body
    const body = await request.json();
    const { subscription_id, user_id, package_slug, order_description, whatsapp, telegram } = body;

    // 🗺️ Map slug to panel package/template IDs
    const { package_id, template_id } = getPanelPackageInfo(package_slug);

    // 🔐 Generate unique username for the user/subscription
    const username = `ROYAL${Math.floor(Math.random() * 1000000)}${Date.now().toString().slice(-5)}`;

    // 📝 Prepare data for external panel API
    const apiData = {
      type: 'M3U',
      username,
      package_id,
      max_connections: 1,
      template_id,
      forced_country: 'ALL',
      adult: false,
      note: order_description, // Most readable for admin!
      whatsapp_telegram: whatsapp || telegram || '',
      enable_vpn: false,
      paid: true
    };

    // 🌐 Call the panel API
    const apiKey = process.env.MEGAOTT_API_KEY; // Use your .env secret!
    const panelRes = await axios.post('https://megaott.net/api/v1/subscriptions', apiData, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    const panelData = panelRes.data;

    // 💾 Create PanelSubscription and link it
    const panelSub = await prisma.panelSubscription.create({
      data: {
        panel_subscription_id: panelData.id,
        subscription_id,
        type: panelData.type,
        username: panelData.username,
        password: panelData.password,
        mac_address: panelData.mac_address,
        package_id: panelData.package?.id,
        package_name: panelData.package?.name,
        template_id: panelData.template?.id,
        template_name: panelData.template?.name,
        max_connections: panelData.max_connections,
        forced_country: panelData.forced_country,
        adult: panelData.adult,
        note: panelData.note,
        whatsapp_telegram: panelData.whatsapp_telegram,
        paid: panelData.paid,
        dns_link: panelData.dns_link,
        dns_link_for_samsung_lg: panelData.dns_link_for_samsung_lg,
        portal_link: panelData.portal_link,
        expiring_at: panelData.expiring_at ? new Date(panelData.expiring_at) : null
      }
    });

    // 🔗 Link PanelSubscription to Subscription
    await prisma.subscription.update({
      where: { subscription_id },
      data: { panel_subscription_id: panelSub.panel_subscription_id }
    });

    return NextResponse.json({ ok: true, panelSub });
  } catch (err) {
    console.error('❌ Panel subscribe error:', err?.response?.data || err.message);
    return NextResponse.json(
      { error: 'Panel subscribe error', detail: err?.response?.data || err.message },
      { status: 500 }
    );
  }
}
