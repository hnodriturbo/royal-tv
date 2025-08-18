/**
 *   ========================= MiddlePage.js ==========================
 * 🚦 CENTRAL REDIRECT & MESSAGING HUB (v3) – loop‑safe
 * --------------------------------------------------------------------
 * 1) Waits for session to settle; if ?login=true then wait until authenticated.
 * 2) Redirects once using a guard flag.
 * 3) Always uses redirectWithMessage (toasts + loader + delay).
 * 4) Picks correct dashboard on login by role (admin/user), else '/'.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';
import { useT } from '@/lib/i18n/client';

// 🚫 Never auto-redirect to these (prevents ping-pong)
const forbiddenRedirects = ['/auth/login', '/auth/middlePage'];

export default function MiddlePage() {
  // 🗣️ Translator for this page namespace
  const t = useT('app.middlePage');

  // 🔗 Query + session + redirect helper
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { redirectWithMessage } = useAppRedirectHandlers();

  // 🔁 Guard against double redirects
  const [alreadyRedirected, setAlreadyRedirected] = useState(false);

  useEffect(() => {
    // 🛑 Don’t run twice and don’t run while session is loading
    if (alreadyRedirected) return;
    if (status === 'loading') return;

    // 📦 Read all query flags
    const loginFlag = searchParams.get('login') === 'true';
    const logoutFlag = searchParams.get('logout') === 'true';
    const guestFlag = searchParams.get('guest') === 'true';
    const notLoggedInFlag = searchParams.get('notLoggedIn') === 'true';
    const adminDenied = searchParams.get('admin') === 'false';
    const userDenied = searchParams.get('user') === 'false';
    const notFoundFlag = searchParams.get('not-found') === 'true';
    const errorCode = searchParams.get('error');
    const redirectToParam = searchParams.get('redirectTo');
    const profileUpdated = searchParams.get('update') === 'profile';
    const profilePasswordUpdated = searchParams.get('passwordUpdate') === 'profile';
    const updateSuccess = searchParams.get('success') === 'true';
    const paymentSuccess = searchParams.get('paymentSuccess') === 'true';

    // 🔒 Prevent loop on login: wait until session says "authenticated"
    if (loginFlag && status !== 'authenticated') {
      return; // 💤 Wait for NextAuth to flip to authenticated after signIn
    }

    // 🎯 Compute default target from role
    let defaultTarget = '/';
    if (session?.user?.role === 'admin') defaultTarget = '/admin/dashboard';
    if (session?.user?.role === 'user') defaultTarget = '/user/dashboard';

    // 🧭 Respect redirectTo when safe
    let chosenTarget = defaultTarget;
    if (
      redirectToParam &&
      !forbiddenRedirects.some((forbiddenPath) => redirectToParam.startsWith(forbiddenPath))
    ) {
      chosenTarget = redirectToParam;
    }

    // 💬 Decide message + color + delay
    let feedbackMessage = '';
    let uiColor = 'info';
    let delayMs = 2000; // ⏳ Default short delay
    const displayName = session?.user?.name || 'User';

    if (status === 'authenticated') {
      // 🎉 Login just happened → go to role dashboard (or safe redirectTo)
      if (loginFlag) {
        feedbackMessage = t(
          'messages.welcome',
          { name: displayName },
          `Welcome ${displayName}! Redirecting…`
        );
        uiColor = 'success';
      }
      // 👋 Logout requested explicitly
      else if (logoutFlag) {
        signOut({ redirect: false });
        feedbackMessage = t(
          'messages.logoutSuccess',
          {},
          'Logout successful. Redirecting to Home…'
        );
        uiColor = 'success';
        chosenTarget = '/';
      }
      // ✅ Profile updated
      else if (profileUpdated && updateSuccess) {
        feedbackMessage = t(
          'messages.profileUpdated',
          {},
          'Profile updated successfully! Redirecting…'
        );
        uiColor = 'success';
      }
      // ✅ Password updated
      else if (profilePasswordUpdated && updateSuccess) {
        feedbackMessage = t(
          'messages.passwordUpdated',
          {},
          'Profile Password updated successfully! Redirecting…'
        );
        uiColor = 'success';
      }
      // 💳 Payment success
      else if (paymentSuccess) {
        feedbackMessage = t(
          'messages.paymentComplete',
          {},
          '✅ Payment complete! Your subscription is being created and pending admin approval.'
        );
        uiColor = 'success';
        chosenTarget = '/user/subscriptions?paymentSuccess=1';
        delayMs = 5000; // ⏳ give more time to read
      }
      // ⛔️ Role denied on an authenticated user (edge)
      else if (adminDenied || userDenied) {
        feedbackMessage = t('messages.accessDenied', {}, 'Access denied for this section.');
        uiColor = 'error';
        chosenTarget = '/';
      }
    } else {
      // 🚷 Not authenticated scenarios
      if (logoutFlag) {
        feedbackMessage = t(
          'messages.logoutSuccess',
          {},
          'Logout successful. Redirecting to Home…'
        );
        uiColor = 'success';
        chosenTarget = '/';
      } else if (notLoggedInFlag || guestFlag) {
        feedbackMessage = t(
          'messages.notAuthorized',
          {},
          'You are not authorized! Redirecting to login…'
        );
        uiColor = 'error';
        chosenTarget = '/auth/signin';
      } else if (adminDenied || userDenied) {
        feedbackMessage = t(
          'messages.accessDeniedLogin',
          {},
          'Access denied! Redirecting to login…'
        );
        uiColor = 'error';
        chosenTarget = `/auth/signin?redirectTo=${encodeURIComponent(chosenTarget)}`;
      } else if (errorCode) {
        const errorKey =
          errorCode === 'CredentialsSignin' || errorCode === 'Configuration'
            ? 'messages.badCredentials'
            : 'messages.unexpectedError';
        feedbackMessage = t(errorKey, {}, 'Unexpected error. Please try again.');
        uiColor = 'error';
        chosenTarget = '/auth/signin';
      }
    }

    // 🧭 404 handling
    if (notFoundFlag) {
      feedbackMessage = t('messages.pageMissing', {}, 'Page does not exist. Redirecting to Home…');
      uiColor = 'info';
      chosenTarget = '/';
    }

    // 🚦 Perform the redirect if there is work to do
    if (feedbackMessage) {
      setAlreadyRedirected(true);
      redirectWithMessage({
        target: chosenTarget,
        message: feedbackMessage,
        loaderText: feedbackMessage,
        color: uiColor,
        loaderOnly: true,
        pageDelay: delayMs
      });
    }
  }, [
    searchParams,
    status,
    session,
    alreadyRedirected,
    redirectWithMessage /* ✅ never add t here */
  ]);

  // 👻 No UI, just logic
  return null;
}
