'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
// Your existing redirect helper (toasts + loader + delay)
import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';

const forbiddenRedirects = ['/auth/login', '/auth/middlePage'];

export default function MiddlePage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { redirectWithMessage } = useAppRedirectHandlers();

  const [alreadyRedirected, setAlreadyRedirected] = useState(false);
  const L = (path) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`;

  useEffect(() => {
    if (alreadyRedirected) return;
    if (status === 'loading') return;

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

    if (loginFlag && status !== 'authenticated') return;

    let defaultTarget = L('/');
    if (session?.user?.role === 'admin') defaultTarget = L('/admin/dashboard');
    if (session?.user?.role === 'user') defaultTarget = L('/user/dashboard');

    let chosenTarget = defaultTarget;
    if (redirectToParam && !forbiddenRedirects.some((p) => redirectToParam.startsWith(p))) {
      chosenTarget = redirectToParam.startsWith('/')
        ? L(redirectToParam)
        : L(`/${redirectToParam}`);
    }

    let feedbackMessage = '';
    let uiColor = 'info';
    let delayMs = 2000;
    const displayName = session?.user?.name || 'User';

    if (status === 'authenticated') {
      if (loginFlag) {
        feedbackMessage = t('app.middlePage.messages.welcome', {
          name: displayName,
          default: `Welcome ${displayName}! Redirecting…`
        });
        uiColor = 'success';
      } else if (logoutFlag) {
        signOut({ redirect: false });
        feedbackMessage = t('app.middlePage.messages.logoutSuccess', {
          default: 'Logout successful. Redirecting to Home…'
        });
        uiColor = 'success';
        chosenTarget = L('/');
      } else if (profileUpdated && updateSuccess) {
        feedbackMessage = t('app.middlePage.messages.profileUpdated', {
          default: 'Profile updated successfully! Redirecting…'
        });
        uiColor = 'success';
      } else if (profilePasswordUpdated && updateSuccess) {
        feedbackMessage = t('app.middlePage.messages.passwordUpdated', {
          default: 'Profile Password updated successfully! Redirecting…'
        });
        uiColor = 'success';
      } else if (paymentSuccess) {
        feedbackMessage = t('app.middlePage.messages.paymentComplete', {
          default:
            '✅ Payment complete! Your subscription is being created and pending admin approval.'
        });
        uiColor = 'success';
        chosenTarget = L('/user/subscriptions?paymentSuccess=1');
        delayMs = 5000;
      } else if (adminDenied || userDenied) {
        feedbackMessage = t('app.middlePage.messages.accessDenied', {
          default: 'Access denied for this section.'
        });
        uiColor = 'error';
        chosenTarget = L('/');
      }
    } else {
      if (logoutFlag) {
        feedbackMessage = t('app.middlePage.messages.logoutSuccess', {
          default: 'Logout successful. Redirecting to Home…'
        });
        uiColor = 'success';
        chosenTarget = L('/');
      } else if (notLoggedInFlag || guestFlag) {
        feedbackMessage = t('app.middlePage.messages.notAuthorized', {
          default: 'You are not authorized! Redirecting to login…'
        });
        uiColor = 'error';
        chosenTarget = L('/auth/signin');
      } else if (adminDenied || userDenied) {
        feedbackMessage = t('app.middlePage.messages.accessDeniedLogin', {
          default: 'Access denied! Redirecting to login…'
        });
        uiColor = 'error';
        chosenTarget = L(`/auth/signin?redirectTo=${encodeURIComponent(chosenTarget)}`);
      } else if (errorCode) {
        const key =
          errorCode === 'CredentialsSignin' || errorCode === 'Configuration'
            ? 'app.middlePage.messages.badCredentials'
            : 'app.middlePage.messages.unexpectedError';
        feedbackMessage = t(key, { default: 'Unexpected error. Please try again.' });
        uiColor = 'error';
        chosenTarget = L('/auth/signin');
      }
    }

    if (notFoundFlag) {
      feedbackMessage = t('app.middlePage.messages.pageMissing', {
        default: 'Page does not exist. Redirecting to Home…'
      });
      uiColor = 'info';
      chosenTarget = L('/');
    }

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
  }, [searchParams, status, session, alreadyRedirected, redirectWithMessage, t, locale, router]);

  return null;
}
