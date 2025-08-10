/**
 *   ========== /api/admin/freeTrials/main ==========
 * 📋
 * GET: List all free trials (no pagination, all at once)
 * Requires: Header x-user-role: admin
 * ==================================================
 */
import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1️⃣ Read user role from header (force lowercase, defensive)
  const userRole = request.headers.get('x-user-role');

  // 2️⃣ Reject if not admin
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  // 3️⃣ Fetch ALL free trials, include user info, no pagination, no sorting
  const trials = await prisma.freeTrial.findMany({
    include: { user: true }
  });

  return NextResponse.json({ trials });
}
