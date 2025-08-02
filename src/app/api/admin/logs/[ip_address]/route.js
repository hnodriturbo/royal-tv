/**
 * ================================================
 * /api/admin/logs/[ip_address]/route.js
 * ================================================
 * 📋 Handles GET/DELETE for logs of a single IP address
 * - Admins only (header x-user-role: admin)
 * ================================================
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// ✅ Get ALL logs for a given IP address
export async function GET(request, context) {
  // 🛡️ Ensure only admins can view logs
  const userRole = (request.headers.get('x-user-role') || '').toLowerCase();
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  // 🌍 Get and decode IP address from params
  const ip_address = decodeURIComponent(context.params.ip_address);
  if (!ip_address) {
    return NextResponse.json({ error: 'Missing IP address.' }, { status: 400 });
  }

  // 📦 Fetch all logs for this IP address
  const logs = await prisma.log.findMany({
    where: { ip_address },
    include: { user: true }
  });

  // 📤 Return the logs as JSON
  return NextResponse.json({ logs });
}

// ❌ Delete ALL logs for a given IP address
export async function DELETE(request, context) {
  // 🛡️ Ensure only admins can delete logs
  const userRole = (request.headers.get('x-user-role') || '').toLowerCase();
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  // 🌍 Get and decode IP address from params
  const ip_address = decodeURIComponent(context.params.ip_address);
  if (!ip_address) {
    return NextResponse.json({ error: 'Missing IP address.' }, { status: 400 });
  }

  // 🗑️ Delete all logs with this IP address
  await prisma.log.deleteMany({ where: { ip_address } });

  // ✅ Success response
  return NextResponse.json({ success: true });
}
