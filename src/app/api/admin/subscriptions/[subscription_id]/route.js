/**
 *   ========== /api/admin/subscriptions/[subscription_id] ==========
 * 📦
 * GET:
 *    - Returns ALL subscriptions for the user who owns this subscription.
 *    - Each subscription includes all its payments.
 *    - The "main" subscription (by subscription_id) is the first in the array.
 *    - Merges into a single array: "subscriptions"
 * DELETE:
 *    - Deletes a subscription by subscription_id.
 * ==================================================================
 * 🧑‍💻 For Admin Use:
 *   - Fetches one or all subscriptions for user card view.
 *   - Also returns user object (as "user") for UI.
 * ==================================================================
 */

import logger from '@/lib/core/logger';
import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';

// 📦 GET: Returns all subscriptions for the user (main sub is first in array)
export async function GET(request, context) {
  // 1️⃣ Read user role from header
  const userRole = request.headers.get('x-user-role');

  // 2️⃣ Reject if not admin
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  const { subscription_id } = context.params;

  // 🔍 Find the main subscription (include user & payments)
  const mainSubscription = await prisma.subscription.findUnique({
    where: { subscription_id },
    include: { user: true, payments: true }
  });

  // ❌ Not found
  if (!mainSubscription) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 🧑‍💻 Get all subscriptions for this user (with payments)
  const user_id = mainSubscription.user.user_id;
  let allSubs = await prisma.subscription.findMany({
    where: { user_id },
    include: { payments: true }
  });

  // 🔗 Ensure the "main" subscription is first in the array
  // (If it's not, move it to the start)
  allSubs = [mainSubscription, ...allSubs.filter((sub) => sub.subscription_id !== subscription_id)];

  // 🟢 Respond with:
  // - subscriptions: all (main sub is first)
  // - user: user object (from main sub)
  return NextResponse.json({
    subscriptions: allSubs, // Array of ALL subscriptions for this user (main sub first)
    user: mainSubscription.user
  });
}

// 🗑️ DELETE: Remove a subscription by ID (admin)
export async function DELETE(request, context) {
  const { subscription_id } = context.params;

  // 🔍 Check if exists for logging/error
  const exists = await prisma.subscription.findUnique({ where: { subscription_id } });
  if (!exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 🗑️ Delete & log
  await prisma.subscription.delete({ where: { subscription_id } });
  logger.log(`🗑️ Deleted subscription: ${subscription_id}`);

  // ✅ Success
  return NextResponse.json({ ok: true });
}
