/**
 * ========================= /src/app/[locale]/auth/middlePage/page.js =========================
 * 🚦 MiddlePage – central redirect & messaging hub (loop‑safe)
 * --------------------------------------------------------------------------------------------
 * - Wait for session to settle; handle ?login=true without ping‑pong
 * - Choose destination by role (admin/user) or fallback to '/'
 * - Always route through redirectWithMessage (toasts + loader + delay)
 * - Uses i18n with full keys via a single `const t = useTranslations()`
 */

'use client';import { useSearchParams } from "next/navigation";

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';
import { useTranslations } from 'next-intl';

// 🚫 Never auto-redirect to these (prevents ping-pong)
const forbiddenRedirects = ['/auth/login', '/auth/middlePage'];

export default function MiddlePage() {
  // 🌐 i18n (full-path keys only)
  const t = useTranslations();

  // 🔗 Query + session + redirect helper
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { redirectWithMessage } = useAppRedirectHandlers();

  // 🧯 Guard against double redirects
  const [alreadyRedirected, setAlreadyRedirected] = useState(false);

  useEffect(() => {
    // 🛑 Avoid double-run and avoid running while session is loading
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

    // 🔒 When logging in, wait until NextAuth truly becomes "authenticated"
    if (loginFlag && status !== 'authenticated') {
      return; // 💤 Waiting for session flip
    }

    // 🎯 Compute default target from role
    let defaultTarget = '/';
    if (session?.user?.role === 'admin') defaultTarget = '/admin/dashboard';
    if (session?.user?.role === 'user') defaultTarget = '/user/dashboard';

    // 🧭 Respect redirectTo when it is safe
    let chosenTarget = defaultTarget;
    if (
    redirectToParam &&
    !forbiddenRedirects.some((forbiddenPath) => redirectToParam.startsWith(forbiddenPath)))
    {
      chosenTarget = redirectToParam;
    }

    // 💬 Decide message + color + delay
    let feedbackMessage = '';
    let uiColor = 'info';
    let delayMs = 2000; // ⏳ Default short delay
    const displayName = session?.user?.name || 'User';

    if (status === 'authenticated') {
      // 🎉 Login success → go to role dashboard (or safe redirectTo)
      if (loginFlag) {
        feedbackMessage = t(
          'app.middlePage.messages.welcome',
          { name: displayName },
          `Welcome ${displayName}! Redirecting…`
        );
        uiColor = 'success';
      }
      // 👋 Logout requested explicitly
      else if (logoutFlag) {
        signOut({ redirect: false });
        feedbackMessage = t(
          'app.middlePage.messages.logoutSuccess',
          {},
          'Logout successful. Redirecting to Home…'
        );
        uiColor = 'success';
        chosenTarget = '/';
      }
      // ✅ Profile updated
      else if (profileUpdated && updateSuccess) {
        feedbackMessage = t(
          'app.middlePage.messages.profileUpdated',
          {},
          'Profile updated successfully! Redirecting…'
        );
        uiColor = 'success';
      }
      // ✅ Password updated
      else if (profilePasswordUpdated && updateSuccess) {
        feedbackMessage = t(
          'app.middlePage.messages.passwordUpdated',
          {},
          'Profile Password updated successfully! Redirecting…'
        );
        uiColor = 'success';
      }
      // 💳 Payment success
      else if (paymentSuccess) {
        feedbackMessage = t(
          'app.middlePage.messages.paymentComplete',
          {},
          '✅ Payment complete! Your subscription is being created and pending admin approval.'
        );
        uiColor = 'success';
        chosenTarget = '/user/subscriptions?paymentSuccess=1';
        delayMs = 5000; // ⏳ give more time to read
      }
      // ⛔️ Role denied on an authenticated user (edge)
      else if (adminDenied || userDenied) {
        feedbackMessage = t(
          'app.middlePage.messages.accessDenied',
          {},
          'Access denied for this section.'
        );
        uiColor = 'error';
        chosenTarget = '/';
      }
    } else {
      // 🚷 Not authenticated scenarios
      if (logoutFlag) {
        feedbackMessage = t(
          'app.middlePage.messages.logoutSuccess',
          {},
          'Logout successful. Redirecting to Home…'
        );
        uiColor = 'success';
        chosenTarget = '/';
      } else if (notLoggedInFlag || guestFlag) {
        feedbackMessage = t(
          'app.middlePage.messages.notAuthorized',
          {},
          'You are not authorized! Redirecting to login…'
        );
        uiColor = 'error';
        chosenTarget = '/auth/signin';
      } else if (adminDenied || userDenied) {
        feedbackMessage = t(
          'app.middlePage.messages.accessDeniedLogin',
          {},
          'Access denied! Redirecting to login…'
        );
        uiColor = 'error';
        chosenTarget = `/auth/signin?redirectTo=${encodeURIComponent(chosenTarget)}`;
      } else if (errorCode) {
        const errorKey =
        errorCode === 'CredentialsSignin' || errorCode === 'Configuration' ?
        'app.middlePage.messages.badCredentials' :
        'app.middlePage.messages.unexpectedError';
        feedbackMessage = t(errorKey, {}, 'Unexpected error. Please try again.');
        uiColor = 'error';
        chosenTarget = '/auth/signin';
      }
    }

    // 🧭 Handle 404 redirect with info message
    if (notFoundFlag) {
      feedbackMessage = t(
        'app.middlePage.messages.pageMissing',
        {},
        'Page does not exist. Redirecting to Home…'
      );
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
  redirectWithMessage /* 🧠 never add t here */]
  );

  // 👻 No UI, just logic
  return null;
}