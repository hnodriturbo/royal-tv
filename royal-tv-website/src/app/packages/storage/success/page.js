/**
 *   ===================== PaymentSuccess.js =====================
 * 🎉
 * PAYMENT SUCCESS PAGE
 * - Shows success message.
 * - Redirects user to subscriptions page after countdown.
 * - Only accessible to authenticated users!
 * ==============================================================
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useAuthGuard from '@/hooks/useAuthGuard';
import CountdownRedirect from '@/components/ui/countdown/CountdownRedirect';

export default function PaymentSuccess() {
  // 🛡️ Auth-guard for logged-in users only
  const { data: session } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');

  useEffect(() => {
    // 🚪 Kick user if not allowed
    if (!isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [isAllowed, redirect, router]);

  // 🕐 Show nothing if not allowed, avoid UI flash
  if (!isAllowed) return null;

  // ✅ Success UI
  return (
    <CountdownRedirect
      seconds={7}
      redirectTo="/user/subscriptions"
      message="🎉 Payment Successful! Your subscription will be ready within 24 hours. You'll receive an email shortly."
      messageSize="text-3xl"
      counterSize="text-xl"
    >
      {/* 🎯 Extra info or action can be placed here if needed */}
    </CountdownRedirect>
  );
}
