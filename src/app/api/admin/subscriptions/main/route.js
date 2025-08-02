/**
 *   ========== /api/admin/subscriptions/main ==========
 * 📦
 * GET: List all subscriptions (admin only, with user info)
 * Requires: Header x-user-role: admin
 * =====================================================
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1️⃣ Read user role from header
  const userRole = request.headers.get('x-user-role');

  // 2️⃣ Reject if not admin
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  // 3️⃣ Fetch ALL subscriptions, include user info, order by newest
  const subscriptions = await prisma.subscription.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ subscriptions });
}
