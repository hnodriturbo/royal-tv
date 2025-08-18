/**
 * ======================= SigninPage.js =======================
 * 🔐 Sign-in form with NextAuth v5 Credentials
 * 🌐 i18n: uses useT('app.signin') for all UI text
 * 🔁 Always finishes via /[locale]/auth/middlePage to avoid loops
 */

'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/language';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useT } from '@/lib/i18n/client';

export default function SigninPage() {
  // 🗣️ Translator bound to this page's namespace
  const t = useT('app.signin');

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
        t('signupWelcomeMessage', { username: initialUsername }, 'Welcome! Please sign in.'),
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
  }, [searchParams, displayMessage, t]);

  // 🟢 Submit handler
  const handleSignin = async (event) => {
    event.preventDefault();

    // 🧪 Basic validation
    if (!usernameValue || !passwordValue) {
      displayMessage(t('fillBothFields', {}, 'Please fill in both username and password.'), 'info');
      return;
    }

    showLoader({ text: t('loggingIn', {}, 'Logging in...') });

    try {
      // 🚦 Sign in with NextAuth credentials (no auto redirect)
      const result = await signIn('credentials', {
        redirect: false,
        username: usernameValue,
        password: passwordValue,
        rememberMe: rememberMeChecked ? true : false
      });

      if (!result?.error) {
        // 🎉 Success → middlePage will route safely
        displayMessage(t('loginSuccess', {}, 'Login successful! Redirecting...'), 'success');

        // 🎯 Find intended redirect (if any)
        const redirectTo = searchParams?.get('redirectTo') || '';

        // 🔁 Always go through middlePage (loop‑safe + toasts)
        const middlePageUrl = `/auth/middlePage?login=true${
          redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''
        }`;

        setTimeout(() => router.replace(middlePageUrl), 1000);
      } else {
        // ❌ Incorrect credentials
        displayMessage(t('wrongCredentials', {}, 'Wrong username or password'), 'error');
      }
    } catch (error) {
      displayMessage(
        t('loginError', { error: String(error) }, `Login error: ${String(error)}`),
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
          {t('title', {}, 'Sign In')}
        </h1>

        {/* 🧾 Sign-in Form */}
        <form onSubmit={handleSignin} noValidate>
          {/* 👤 Username */}
          <input
            id="username"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('usernamePlaceholder', {}, 'Enter your username')}
            value={usernameValue}
            onChange={(event) => setUsernameValue(event.target.value)}
            autoFocus
          />

          {/* 🔒 Password */}
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('passwordPlaceholder', {}, 'Enter your password')}
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
            {t('rememberMe', {}, 'Remember me')}
          </label>

          {/* 🚀 Submit */}
          <button
            type="submit"
            className="w-full py-2 text-white rounded-lg bg-blue-400 hover:bg-blue-600"
          >
            {t('submitButton', {}, 'Sign In')}
          </button>
        </form>

        {/* 🔗 Sign up prompt */}
        <p className="text-center mt-4">
          {t('noAccountPrompt', {}, 'Don’t have an account?')}{' '}
          <a href="/auth/signup" className="underline">
            {t('signUpLink', {}, 'Sign up')}
          </a>
        </p>
      </div>
    </div>
  );
}
