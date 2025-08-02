/**
 *   ========================= MiddlePage.js ==========================
 * 🚦  CENTRAL REDIRECT & MESSAGING HUB (v3) – *loop‑safe*
 * --------------------------------------------------------------------
 * 1. Waits for NextAuth to fully settle **and** (when ?login=true) for
 *    the session to be authenticated before deciding what to do.
 * 2. Guests are redirected only once. Further renders are ignored via
 *    the `redirected` flag.
 * 3. Always uses `redirectWithMessage` for feedback & redirect.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';

// 🏷️ Friendly error mapping
const errorLabels = {
  CredentialsSignin: 'Incorrect username or password.',
  Configuration: 'Incorrect username or password.',
  default: 'Unexpected error. Please try again.'
};

// 🚫 Never auto-redirect to these pages
const forbiddenRedirects = ['/auth/login', '/auth/middlePage'];

const MiddlePage = () => {
  // 🔗 Get query params, NextAuth session, and your custom redirect helper
  const searchParams = useSearchParams();
  const { redirectWithMessage } = useAppRedirectHandlers();
  const { data: session, status } = useSession();

  // 🔁 Local state to block double redirects
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // 🛑 1. Block double-redirects, or if session loading, pause
    if (redirected) return;
    if (status === 'loading') return;

    // 📦 2. Gather all query params
    const login = searchParams.get('login') === 'true';
    const logout = searchParams.get('logout') === 'true';
    const guest = searchParams.get('guest') === 'true';
    const notIn = searchParams.get('notLoggedIn') === 'true';
    const adminNo = searchParams.get('admin') === 'false';
    const userNo = searchParams.get('user') === 'false';
    const notFound = searchParams.get('not-found') === 'true';
    const error = searchParams.get('error');
    const redirectToParam = searchParams.get('redirectTo');
    const profileUpdated = searchParams.get('update') === 'profile';
    const profilePasswordUpdated = searchParams.get('passwordUpdate') === 'profile';
    const updateSuccess = searchParams.get('success') === 'true';
    const paymentSuccess = searchParams.get('paymentSuccess') === 'true';

    // 🔒 3. Prevent loop on login: only redirect after session is authenticated
    if (login && status !== 'authenticated') {
      // 💤 Wait until session reflects the new login (solves login-redirect-loop)
      return;
    }

    // 🎯 4. Decide default and safe redirect targets
    let defaultTarget = '/';
    if (session?.user?.role === 'admin') defaultTarget = '/admin/dashboard';
    if (session?.user?.role === 'user') defaultTarget = '/user/dashboard';

    let target = defaultTarget;
    if (
      redirectToParam &&
      !forbiddenRedirects.some((forbidden) => redirectToParam.startsWith(forbidden))
    ) {
      target = redirectToParam;
    }

    // 💬 5. Pick feedback message & color
    let message = '';
    let color = 'info';
    const name = session?.user?.name || 'User';

    if (status === 'authenticated') {
      // 🎉 Just logged in
      if (login) {
        message = `Welcome ${name}! Redirecting to your page…`;
        color = 'success';
      }
      // 👋 Just logged out
      else if (logout) {
        signOut({ redirect: false });
        message = 'Logout successful. Redirecting to Home…';
        color = 'success';
        target = '/';
      }
      // ✅ Profile Updated Success
      else if (profileUpdated && updateSuccess) {
        message = 'Profile updated successfully! Redirecting…';
        color = 'success';
      }
      // ✅ Profile Password Updated Success
      else if (profilePasswordUpdated && updateSuccess) {
        message = 'Profile Password updated successfully! Redirecting…';
        color = 'success';
      }
      // ✅ Payment success
      else if (paymentSuccess) {
        message =
          '✅ Payment complete! Your subscription is being created and pending admin approval.';
        color = 'success';
        target = '/user/subscriptions?paymentSuccess=1';
        pageDelay = 5000;
      }
      // ⛔️ Role denied
      else if (adminNo || userNo) {
        message = 'Access denied for this section.';
        color = 'error';
        target = '/';
      }
    } else {
      // 🔓 Not authenticated cases
      if (logout) {
        message = 'Logout successful. Redirecting to Home…';
        color = 'success';
        target = '/';
      } else if (notIn || guest) {
        message = 'You are not authorized! Redirecting to login…';
        color = 'error';
        target = '/auth/signin';
      } else if (adminNo || userNo) {
        message = 'Access denied! Redirecting to login…';
        color = 'error';
        target = `/auth/signin?redirectTo=${encodeURIComponent(target)}`;
      } else if (error) {
        message = errorLabels[error] || errorLabels.default;
        color = 'error';
        target = '/auth/signin';
      }
    }

    // 🧭 Page not found
    if (notFound) {
      message = 'Page does not exist. Redirecting to Home…';
      color = 'info';
      target = '/';
    }

    // 🚦 6. Only trigger redirect if there's a message/action to take
    if (message) {
      setRedirected(true);
      // 🪄 Use your custom redirect/toast handler (show message, then nav)
      redirectWithMessage({
        target,
        message,
        loaderText: message,
        color,
        loaderOnly: true,
        pageDelay: 2000 // Slightly faster (2s, tweak if you want!)
      });
    }
  }, [searchParams, status, session, redirected, redirectWithMessage]);

  // 👻 No UI, only logic!
  return null;
};

export default MiddlePage;
