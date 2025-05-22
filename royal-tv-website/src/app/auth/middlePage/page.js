/**
 *   ========================= MiddlePage.js ==========================
 * 🚦
 * CENTRAL REDIRECT & MESSAGING HUB:
 * Used after login, logout, or failed guard checks to show toast and redirect.
 * - Reads query‑params set by useAuthGuard or login/logout logic.
 * - Decides user feedback + redirect target (dashboard, home, etc).
 * - Shows toast (success, error, info) using useAppHandlers.
 * - Uses a splash delay for user feedback before navigating away.
 * ====================================================================
 * ⚙️
 * PROPS:
 *   None (reads from query-params & session)
 * ====================================================================
 * 📌
 * USAGE:
 *   Used as an internal "invisible" page for all main auth workflows.
 *   Place wherever you need auto‑redirect + toast after a login/logout/guard.
 * ====================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';
import useAppHandlers from '@/hooks/useAppHandlers';

// 🏷️ Map NextAuth errors to friendly messages
const errorLabels = {
  CredentialsSignin: 'Incorrect username or password.',
  Configuration: 'Incorrect username or password.',
  default: 'Unexpected error. Please try again.'
};

const MiddlePage = () => {
  // 🌐 Read query parameters and session state
  const searchParams = useSearchParams();
  const { redirectWithMessage } = useAppRedirectHandlers();
  const { data: session, status } = useSession();

  // 🔁 Local state to prevent double redirects
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // ⏳ Prevent running twice or before session loaded
    if (redirected) return;
    if (status === 'loading') return;

    // 🔍 Flags from URL query
    const login = searchParams.get('login') === 'true';
    const logout = searchParams.get('logout') === 'true';
    const guest = searchParams.get('guest') === 'true';
    const notLoggedIn = searchParams.get('notLoggedIn') === 'true';
    const adminDenied = searchParams.get('admin') === 'false';
    const userDenied = searchParams.get('user') === 'false';
    const notFound = searchParams.get('not-found') === 'true';
    const error = searchParams.get('error');

    // 🛠️ Build message, color, target for toast & redirect
    const name = session?.user?.name || 'User';
    let message = '';
    let color = 'info';
    let target = '/';

    // 🎉 Successful login: show welcome, send to dashboard
    if (login) {
      const destination = session?.user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      message = `Welcome ${name}! Redirecting to your dashboard…`;
      color = 'success';
      target = destination;
    }

    // ❌ Error handling (login failure, config, etc)
    if (error) {
      message = errorLabels[error] || errorLabels.default;
      color = 'error';
    } else if (logout) {
      // 🚪 User logged out, go home
      signOut({ redirect: false });
      message = 'Logout successful. Redirecting to Home…';
      color = 'success';
    } else if (notLoggedIn || guest) {
      // 🔐 Unauthorized access
      message = 'You are not authorized to view this page! Redirecting to Home…';
      color = 'error';
    } else if (notFound) {
      // 📭 Page not found
      message = 'The page you are trying to access does not exist. Redirecting to Home…';
    } else if (userDenied) {
      // ⛔ User dashboard restriction
      message = `Request denied! Redirecting to ${name} dashboard…`;
      color = 'error';
      target = '/user/dashboard';
    } else if (adminDenied) {
      // ⛔ Admin dashboard restriction
      message = `Request denied! Redirecting to Admin dashboard…`;
      color = 'error';
      target = '/admin/dashboard';
    }

    // 🚦 Show toast and perform redirect with splash delay
    if (message) {
      setRedirected(true);
      redirectWithMessage({
        target,
        message,
        loaderText: message,
        color,
        loaderOnly: true,
        pageDelay: 3000 // ⏲️ 3 seconds before redirect
      });
    }
  }, [searchParams, status, session, redirected, redirectWithMessage]);

  return null; // 🕳️ No UI; used only for redirecting
};

export default MiddlePage;
