/**
 * ======================= /src/app/[locale]/auth/signin/page.js =======================
 * 🔐 Sign-in page with NextAuth v5 Credentials
 * ------------------------------------------------------------------------------------
 * - Displays a simple credentials form
 * - Uses i18n via full-path keys with a single `const t = useT()`
 * - Routes through /auth/middlePage to avoid login loops and unify toasts
 */

'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n'; // 🧭 merged: router + locale-aware Link ✅
import useAppHandlers from '@/hooks/useAppHandlers';
import { useTranslations, useLocale } from 'next-intl';

export default function SigninPage() {
  // 🌐 i18n (full-path keys only)
  const t = useTranslations();

  // 🧭 Navigation + query helpers
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🟦 Initial values from query (e.g., after signup)
  const initialUsername = searchParams?.get('username') || '';
  const isSignupFlow = searchParams?.get('signup') === 'true';

  // 🧰 Global message/loader handlers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 📝 Local form state
  const [usernameValue, setUsernameValue] = useState(initialUsername);
  const [passwordValue, setPasswordValue] = useState('');
  const [rememberMeChecked, setRememberMeChecked] = useState(false);

  useEffect(() => {
    // 💌 Show welcome if coming from signup
    if (isSignupFlow && initialUsername) {
      displayMessage(
        t(
          'app.signin.signupWelcomeMessage',
          { username: initialUsername },
          'Welcome! Please sign in.'
        ),
        'success'
      );
      return;
    }

    // ⚠️ Display any error/message carried in query
    const errorOrMessage =
      searchParams?.get('error') || searchParams?.get('message') || searchParams?.get('info');
    if (errorOrMessage) {
      displayMessage(decodeURIComponent(errorOrMessage), 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, displayMessage, t, isSignupFlow, initialUsername]);

  // 🟢 Submit handler
  const handleSignin = async (event) => {
    event.preventDefault();

    // 🧪 Basic validation
    if (!usernameValue || !passwordValue) {
      displayMessage(
        t('app.signin.fillBothFields', {}, 'Please fill in both username and password.'),
        'info'
      );
      return;
    }

    showLoader({ text: t('app.signin.loggingIn', {}, 'Logging in...') });

    try {
      // 🚦 Sign in with NextAuth credentials (no auto redirect)
      const result = await signIn('credentials', {
        redirect: false,
        username: usernameValue,
        password: passwordValue,
        remember_me: rememberMeChecked ? 'on' : '' // 🧠 underscore key matches provider
      });

      if (!result?.error) {
        // 🎉 Success → middlePage will route safely
        displayMessage(
          t('app.signin.loginSuccess', {}, 'Login successful! Redirecting...'),
          'success'
        );

        // 🎯 Find intended redirect (if any)
        const redirectTo = searchParams?.get('redirectTo') || '';

        // 🔁 Always go through middlePage (loop-safe + toasts)
        const middlePageUrl = `/auth/middlePage?login=true${
          redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''
        }`;

        setTimeout(() => router.replace(middlePageUrl), 1000);
      } else {
        // ❌ Incorrect credentials
        displayMessage(t('app.signin.wrongCredentials', {}, 'Wrong username or password'), 'error');
      }
    } catch (error) {
      displayMessage(
        t('app.signin.loginError', { error: String(error) }, `Login error: ${String(error)}`),
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="flex items-center justify-center w-full mt-20">
      <div className="container-style lg:w-[700px] mx-auto my-12">
        {/* 🏷️ Page Title */}
        <h1 className="text-4xl font-semibold text-center mb-5 super-decorative-2">
          {t('app.signin.title', {}, 'Sign In')}
        </h1>

        {/* 🧾 Sign-in Form */}
        <form onSubmit={handleSignin} noValidate>
          {/* 👤 Username */}
          <input
            id="username"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('app.signin.usernamePlaceholder', {}, 'Enter your username')}
            value={usernameValue}
            onChange={(event) => setUsernameValue(event.target.value)}
            autoFocus
          />

          {/* 🔒 Password */}
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('app.signin.passwordPlaceholder', {}, 'Enter your password')}
            value={passwordValue}
            onChange={(event) => setPasswordValue(event.target.value)}
          />

          {/* 🧠 Remember me */}
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={rememberMeChecked}
              onChange={(event) => setRememberMeChecked(event.target.checked)}
              className="mr-2"
            />
            {t('app.signin.rememberMe', {}, 'Remember me')}
          </label>

          {/* 🚀 Submit */}
          <button
            type="submit"
            className="w-full py-2 text-white rounded-lg bg-blue-400 hover:bg-blue-600"
          >
            {t('app.signin.submitButton', {}, 'Sign In')}
          </button>
        </form>

        {/* 🔗 Sign up prompt */}
        <p className="text-center mt-4">
          {t('app.signin.noAccountPrompt', {}, 'Don’t have an account?')}{' '}
          <Link href="/auth/signup" className="underline">
            {t('app.signin.signUpLink', {}, 'Sign up')}
          </Link>
        </p>
      </div>
    </div>
  );
}
