'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';

export default function SignInForm() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const initialUsername = searchParams?.get('username') || '';
  const isSignupFlow = searchParams?.get('signup') === 'true';

  const [usernameValue, setUsernameValue] = useState(initialUsername);
  const [passwordValue, setPasswordValue] = useState('');
  const [rememberMeChecked, setRememberMeChecked] = useState(false);

  useEffect(() => {
    if (isSignupFlow && initialUsername) {
      displayMessage(
        t('app.signin.signupWelcomeMessage', {
          username: initialUsername,
          default: 'Welcome! Please sign in.'
        }),
        'success'
      );
      return;
    }
    const errOrMsg =
      searchParams?.get('error') || searchParams?.get('message') || searchParams?.get('info');
    if (errOrMsg) displayMessage(decodeURIComponent(errOrMsg), 'error');
  }, [searchParams, displayMessage, t, isSignupFlow, initialUsername]);

  async function handleSignin(e) {
    e.preventDefault();

    if (!usernameValue || !passwordValue) {
      displayMessage(
        t('app.signin.fillBothFields', { default: 'Please fill in both username and password.' }),
        'info'
      );
      return;
    }

    showLoader({ text: t('app.signin.loggingIn', { default: 'Logging in...' }) });

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username: usernameValue,
        password: passwordValue,
        remember_me: rememberMeChecked ? 'on' : ''
      });

      if (!result?.error) {
        displayMessage(
          t('app.signin.loginSuccess', { default: 'Login successful! Redirecting...' }),
          'success'
        );
        const redirectTo = searchParams?.get('redirectTo') || '';
        const middle = `/${locale}/auth/middlePage?login=true${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
        setTimeout(() => router.replace(middle), 1000);
      } else {
        displayMessage(
          t('app.signin.wrongCredentials', { default: 'Wrong username or password' }),
          'error'
        );
      }
    } catch (error) {
      displayMessage(
        t('app.signin.loginError', {
          error: String(error),
          default: `Login error: ${String(error)}`
        }),
        'error'
      );
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="flex items-center justify-center w-full mt-20">
      <div className="container-style lg:w-[700px] mx-auto my-12">
        <h1 className="text-4xl font-semibold text-center mb-5 super-decorative-2">
          {t('app.signin.title', { default: 'Sign In' })}
        </h1>

        <form onSubmit={handleSignin} noValidate>
          <input
            id="username"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('app.signin.usernamePlaceholder', { default: 'Enter your username' })}
            value={usernameValue}
            onChange={(e) => setUsernameValue(e.target.value)}
            autoFocus
          />

          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('app.signin.passwordPlaceholder', { default: 'Enter your password' })}
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
          />

          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={rememberMeChecked}
              onChange={(e) => setRememberMeChecked(e.target.checked)}
              className="mr-2"
            />
            {t('app.signin.rememberMe', { default: 'Remember me' })}
          </label>

          <button
            type="submit"
            className="w-full py-2 text-white rounded-lg bg-blue-400 hover:bg-blue-600"
          >
            {t('app.signin.submitButton', { default: 'Sign In' })}
          </button>
        </form>

        <p className="text-center mt-4">
          {t('app.signin.noAccountPrompt', { default: 'Don’t have an account?' })}{' '}
          <Link href={`/${locale}/auth/signup`} className="underline">
            {t('app.signin.signUpLink', { default: 'Sign up' })}
          </Link>
        </p>
      </div>
    </div>
  );
}
