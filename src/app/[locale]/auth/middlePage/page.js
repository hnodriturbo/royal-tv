'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';

// Treat these as "do not send users back into these"
const FORBIDDEN = new Set([
  /*   '/auth/login',
  '/auth/signin',
  '/auth/signout', */
  '/auth/middlePage',
  '/auth/callback',
  '/auth/verify-request',
  '/auth/error'
]);

const LOCALE_RE = /^\/([a-z]{2})(?=\/|$)/i;
const stripLocale = (p) => p.replace(LOCALE_RE, '');
const hasAnyLocale = (p) => LOCALE_RE.test(p);
const isTrivial = (p) => !p || p === '/' || p === '//';

export default function MiddlePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { redirectWithMessage } = useAppRedirectHandlers(); // shows RingLoader + replaces URL after delay :contentReference[oaicite:1]{index=1}

  // remount-safe guard (dev/HMR)
  const navigated = useRef(false);

  const L = (path) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`;

  useEffect(() => {
    if (status === 'loading' || navigated.current) return;

    const qp = (k) => searchParams.get(k);
    const loginFlag = qp('login') === 'true';
    const logoutFlag = qp('logout') === 'true';
    const guestFlag = qp('guest') === 'true';
    const notLoggedInFlag = qp('notLoggedIn') === 'true';
    const adminDenied = qp('admin') === 'false';
    const userDenied = qp('user') === 'false';
    const notFound = qp('not-found') === 'true';
    const errorCode = qp('error');
    const redirectTo = qp('redirectTo') || '';
    const profileUpdated = qp('update') === 'profile';
    const profilePasswordUpdated = qp('passwordUpdate') === 'profile';
    const updateSuccess = qp('success') === 'true';
    const paymentSuccess = qp('paymentSuccess') === 'true';

    // role defaults
    let target = L('/');
    const role = session?.user?.role;
    if (role === 'admin') target = L('/admin/dashboard');
    if (role === 'user') target = L('/user/dashboard');

    // normalize redirectTo (respect existing locale, block auth/self, ignore trivial)
    const safeRedirect = (() => {
      if (!redirectTo) return null;
      const asPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
      const check = stripLocale(asPath);
      if (isTrivial(check)) return null;
      for (const bad of FORBIDDEN) if (check.startsWith(bad)) return null;
      return hasAnyLocale(asPath) ? asPath : L(asPath);
    })();

    // message + delay
    let msg = 'Redirecting…';
    let color = 'info';
    let delayMs = 1200;

    // pick target + message
    if (status === 'authenticated') {
      if (logoutFlag) {
        signOut({ redirect: false });
        target = L('/');
        msg = 'Logout successful. Redirecting to Home…';
        color = 'success';
      } else if (loginFlag) {
        target = safeRedirect || target;
        try {
          // prefer i18n if available; fall back to plain text
          msg = t('app.middlePage.messages.welcome', { name: session?.user?.name || 'User' });
        } catch {
          msg = `Welcome ${session?.user?.name || 'User'}! Redirecting…`;
        }
        color = 'success';
      } else if (paymentSuccess) {
        target = L('/user/subscriptions?paymentSuccess=1');
        msg = '✅ Payment complete! Redirecting…';
        color = 'success';
        delayMs = 2000;
      } else if (adminDenied || userDenied) {
        target = L('/');
        msg = 'Access denied for this section.';
        color = 'error';
      } else if ((profileUpdated && updateSuccess) || (profilePasswordUpdated && updateSuccess)) {
        target = safeRedirect || target;
        msg = 'Changes saved. Redirecting…';
        color = 'success';
      } else if (errorCode) {
        target = L('/auth/signin');
        msg = 'Unexpected error. Redirecting to sign in…';
        color = 'error';
      } else {
        // authenticated + no flags → go to dashboard
        target = safeRedirect || target;
        msg = 'Redirecting…';
      }
    } else {
      // unauthenticated
      if (logoutFlag) {
        target = L('/');
        msg = 'Logout successful. Redirecting to Home…';
        color = 'success';
      } else if (notLoggedInFlag || guestFlag) {
        target = L('/auth/signin');
        msg = 'You are not authorized! Redirecting to login…';
        color = 'error';
      } else if (adminDenied || userDenied) {
        const back = safeRedirect || target;
        target = L(`/auth/signin?redirectTo=${encodeURIComponent(back)}`);
        msg = 'Access denied! Redirecting to login…';
        color = 'error';
      } else if (errorCode) {
        target = L('/auth/signin');
        msg = 'Unexpected error. Redirecting to sign in…';
        color = 'error';
      } else if (notFound) {
        target = L('/');
        msg = 'Page does not exist. Redirecting to Home…';
        color = 'info';
      } else {
        target = L('/auth/signin');
        msg = 'Redirecting…';
      }
    }

    // avoid redirecting to ourselves
    const here =
      typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
    if (target === here || stripLocale(target) === stripLocale(here)) {
      target =
        role === 'admin' ? L('/admin/dashboard') : role === 'user' ? L('/user/dashboard') : L('/');
    }

    // fire!
    navigated.current = true;
    // show RingLoader + navigate after delay (your helper) :contentReference[oaicite:2]{index=2}
    redirectWithMessage({
      target,
      message: msg,
      loaderText: msg,
      color,
      loaderOnly: true,
      pageDelay: delayMs
    });

    // last-ditch safety: if we’re somehow still here after delay + 800ms, hard-navigate
    const failSafe = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const stillHere = window.location.pathname + window.location.search === here;
        if (stillHere) window.location.assign(target);
      }
    }, delayMs + 800);

    return () => clearTimeout(failSafe);
  }, [status, session, searchParams, t, locale, redirectWithMessage, router]);

  return null;
}
