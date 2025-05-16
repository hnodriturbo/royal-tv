// 📄 MiddlePage.js
// 🚦 Central redirect / messaging hub used right after login, logout, or guard failures
//    • Reads query‑params set by useAuthGuard or the login page
//    • Shows a toast via useAppHandlers and then redirects appropriately

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';
import useAppHandlers from '@/hooks/useAppHandlers';

/* 🏷️  Friendly error labels for NextAuth error codes */
const errorLabels = {
  CredentialsSignin: 'Incorrect username or password.',
  Configuration: 'Incorrect username or password.', // provider mis‑config looks identical to user
  default: 'Unexpected error. Please try again.',
};

const MiddlePage = () => {
  const searchParams = useSearchParams();
  const { redirectWithMessage } = useAppRedirectHandlers();
  const { data: session, status } = useSession();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (redirected) return; // 🔁 prevent double work
    if (status === 'loading') return; // ⏳ wait for session

    /* ─────────────────────────────────────────────── */
    /*  Query‑param flags                            */
    /* ─────────────────────────────────────────────── */
    const login = searchParams.get('login') === 'true';
    const logout = searchParams.get('logout') === 'true';
    const guest = searchParams.get('guest') === 'true';
    const notLoggedIn = searchParams.get('notLoggedIn') === 'true';
    const adminDenied = searchParams.get('admin') === 'false';
    const userDenied = searchParams.get('user') === 'false';
    const notFound = searchParams.get('not-found') === 'true';
    const error = searchParams.get('error'); // e.g. CredentialsSignin

    /* ─────────────────────────────────────────────── */
    /*  Build the message + redirect target           */
    /* ─────────────────────────────────────────────── */
    const name = session?.user?.name || 'User';
    let message = '';
    let color = 'info';
    let target = '/';

    if (login) {
      const destination =
        session?.user?.role === 'admin'
          ? '/admin/dashboard'
          : '/user/dashboard';
      message = `Welcome ${name}! Redirecting to your dashboard…`;
      color = 'success';
      target = destination;
    }

    if (error) {
      message = error;
      color = 'error';
    } else if (logout) {
      signOut({ redirect: false });
      message = 'Logout successful. Redirecting to Home…';
      color = 'success';
    } else if (notLoggedIn || guest) {
      message =
        'You are not authorized to view this page! Redirecting to Home…';
      color = 'error';
    } else if (notFound) {
      message =
        'The page you are trying to access does not exist. Redirecting to Home…';
    } else if (adminDenied) {
      message = `Request denied! Redirecting to ${name} dashboard…`;
      color = 'error';
      target = '/user/dashboard';
    } else if (userDenied) {
      message = `Request denied! Redirecting to Admin dashboard…`;
      color = 'error';
      target = '/admin/dashboard';
    }

    /* ─────────────────────────────────────────────── */
    /*  Perform redirect + toast                       */
    /* ─────────────────────────────────────────────── */
    if (message) {
      setRedirected(true);
      redirectWithMessage({
        target,
        message,
        loaderText: message,
        color,
        loaderOnly: true,
        pageDelay: 3000, // 3‑s splash before redirect
      });
    }
  }, [searchParams, status, session, redirected, redirectWithMessage]);

  return null; // nothing visual; it’s only a redirect hub
};

export default MiddlePage;
