/**
 * GET /api/user/freeTrials
 * --------------------------
 * Fetch the current user's latest free trial (all fields, new schema)
 *
 * Headers:
 *   • x-user-id: string (from middleware/session)
 *   • x-user-role: string (must be 'user' to view own trial)
 * --------------------------
 * Returns:
 *   { ...freeTrial fields (see schema) } | { error }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';

export async function GET(request) {
  // 🛡️ Get user ID from middleware-injected headers
  const user_id = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role');
  if (!user_id || role !== 'user') {
    // 🚫 Must be logged in as user
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // 🔎 Fetch the latest free trial for this user
  try {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id },
      orderBy: { createdAt: 'desc' }
    });

    if (!freeTrial) {
      // 👀 No trial found
      return NextResponse.json(null, { status: 200 });
    }

    // 📝 Send all trial fields (matches schema)
    return NextResponse.json(freeTrial, { status: 200 });
  } catch (error) {
    // 🔴 Query/database error
    return NextResponse.json({ error: 'Failed to fetch free trial' }, { status: 500 });
  }
}
