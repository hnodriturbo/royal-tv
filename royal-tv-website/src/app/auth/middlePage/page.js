/**
 *   ========================= MiddlePage.js ==========================
 * 🚦
 * CENTRAL REDIRECT & MESSAGING HUB:
 * Handles all auth-related redirects and feedback.
 * - Reads why user was redirected and where they *should* go next.
 * - Always prioritizes "redirectTo" if it exists and is safe.
 * ====================================================================
 * ⚙️
 * PROPS:
 *   None (reads from query-params & session)
 * ====================================================================
 * 📌
 * USAGE:
 *   Used as an invisible hub for all main auth workflows.
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

// 🛡️ List of pages we never want to auto-redirect to
const forbiddenRedirects = ['/auth/login', '/auth/middlePage'];

const MiddlePage = () => {
  // 🌐 Read query parameters and session state
  const searchParams = useSearchParams();
  const { redirectWithMessage } = useAppRedirectHandlers();
  const { data: session, status } = useSession();

  // 🔁 Local state to prevent double redirects
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (redirected) return;
    if (status === 'loading') return;

    // 🧾 Gather query params
    const login = searchParams.get('login') === 'true';
    const logout = searchParams.get('logout') === 'true';
    const guest = searchParams.get('guest') === 'true';
    const notLoggedIn = searchParams.get('notLoggedIn') === 'true';
    const adminDenied = searchParams.get('admin') === 'false';
    const userDenied = searchParams.get('user') === 'false';
    const notFound = searchParams.get('not-found') === 'true';
    const error = searchParams.get('error');
    const redirectToParam = searchParams.get('redirectTo');

    const profileUpdated = searchParams.get('update') === 'profile';
    const profilePasswordUpdated = searchParams.get('passwordUpdate') === 'profile';
    const updateSuccess = searchParams.get('success') === 'true';
    const role = searchParams.get('role') || 'user'; // fallback

    // 🧑‍💻 User name
    const name = session?.user?.name || 'User';

    // 💬 Default message and color
    let message = '';
    let color = 'info';

    // 🎯 Redirect target: always prefer safe "redirectTo" param if present
    let defaultTarget = '/';
    if (session?.user?.role === 'admin') defaultTarget = '/admin/dashboard';
    if (session?.user?.role === 'user') defaultTarget = '/user/dashboard';

    // 🚫 Forbid redirecting to login or middlePage itself!
    let target = defaultTarget;
    if (
      redirectToParam &&
      !forbiddenRedirects.some((forbidden) => redirectToParam.startsWith(forbidden))
    ) {
      target = redirectToParam;
    }

    // 🟢 Success login: Welcome & redirect
    if (login) {
      message = `Welcome ${name}! Redirecting to your page…`;
      color = 'success';
    }
    // 🚪 User logged out
    else if (logout) {
      signOut({ redirect: false });
      message = 'Logout successful. Redirecting to Home…';
      color = 'success';
      target = '/';
    }
    // 🔐 Unauthorized access (not logged in)
    else if (notLoggedIn || guest) {
      message = 'You are not authorized to view this page! Redirecting to Home…';
      color = 'error';
      target = '/';
    }
    // 🔐 Admin Denied & Remember Page
    else if (adminDenied) {
      message = `Request denied! You must be an admin. Redirecting to sign in…`;
      color = 'error';
      // Always redirect to signin with intended page preserved
      target = `/auth/signin?redirectTo=${encodeURIComponent(redirectToParam || '/admin/dashboard')}`;
    }
    // 🔐 User Denied & Remember Page
    else if (userDenied) {
      message = `Request denied! You must be a user. Redirecting to sign in…`;
      color = 'error';
      // Always redirect to signin with intended page preserved
      target = `/auth/signin?redirectTo=${encodeURIComponent(redirectToParam || '/user/dashboard')}`;
    }
    // 🛠️ Profile update
    else if (profileUpdated && updateSuccess) {
      message = 'Profile updated successfully! Redirecting…';
      color = 'success';
    } else if (profilePasswordUpdated && updateSuccess) {
      message = 'Profile Password updated successfully! Redirecting…';
      color = 'success';
    }
    // 🆘 Error handling (login failure, config, etc)
    else if (error) {
      message = errorLabels[error] || errorLabels.default;
      color = 'error';
      target = '/';
    }
    // 📭 Not found
    else if (notFound) {
      message = 'The page you are trying to access does not exist. Redirecting to Home…';
      target = '/';
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

  return null; // 🕳️ No UI; just a redirect hub!
};

export default MiddlePage;
