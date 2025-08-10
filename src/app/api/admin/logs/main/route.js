/**
 * ================================================
 * /api/admin/logs/main
 * ================================================
 * 📋 GET: Returns all log entries (admin only)
 * - No pagination or backend sorting, returns full array for frontend to sort/paginate.
 * - Requires header: x-user-role: admin (middleware injects automatically).
 * ================================================
 */

import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1️⃣ Read user role from header (force lowercase)
  const userRole = (request.headers.get('x-user-role') || '').toLowerCase();

  // 2️⃣ Reject if not admin
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  // 3️⃣ Fetch ALL logs, include user info
  const logs = await prisma.log.findMany({
    include: { user: true }
  });

  // 4️⃣ Return logs
  return NextResponse.json({ logs });
}
