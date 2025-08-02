/**
 * ========== /api/user/subscriptions ==========
 * 📦
 * GET: List all subscriptions for a user, with all details + payments
 * Requires: Headers x-user-id, x-user-role: user
 * Sort: none (let FE sort, sends all subs)
 * ================================================
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 🟢 Read user id and role from headers (force lowercase, defensive)
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  // 🛑 Only users allowed
  if (!userId || userRole !== 'user') {
    return NextResponse.json({ error: 'Unauthorized. Users only.' }, { status: 403 });
  }

  // 📦 Fetch ALL subscriptions for user, include ALL fields and payments
  const subscriptions = await prisma.subscription.findMany({
    where: { user_id: userId },
    orderBy: { createdAt: 'desc' }, // newest first, you can FE-sort too
    include: {
      payments: true // include all payment records
    }
  });

  // 🟢 Return all subscription info, FE can sort or filter as needed
  return NextResponse.json({ subscriptions });
}
