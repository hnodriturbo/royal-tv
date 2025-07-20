/**
 * Login Page
 * ============================
 * - Handles login form for username/password
 * - Uses NextAuth v5 credentials provider (no remember me)
 * - Always redirects via /auth/middlePage for all flows
 */

'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAppHandlers from '@/hooks/useAppHandlers';

const LoginPage = () => {
  // 🪧 Hooks for UI messages and navigation
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🟦 Prefill username if redirected from signup flow
  const initialUsername = searchParams?.get('username') || '';
  const isSignup = searchParams?.get('signup') === 'true';

  // 🟩 Local form state
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');

  useEffect(() => {
    // 📨 Show welcome for signup, else show any error
    if (isSignup) {
      displayMessage(
        `Welcome, ${initialUsername}! Please enter your password to finish registration.`,
        'success'
      );
    } else {
      const errorOrMessage = searchParams?.get('error') || searchParams?.get('message');
      if (errorOrMessage) {
        displayMessage(decodeURIComponent(errorOrMessage) || 'An error occurred.', 'error');
      }
    }
    // eslint-disable-next-line
  }, [searchParams, displayMessage]);

  // 🟢 Handle login form submit
  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username || !password) {
      displayMessage('Please fill in both username and password.', 'info');
      return;
    }

    showLoader({ text: 'Logging in...' });

    try {
      // 🚦 Sign in using NextAuth credentials provider, no redirect yet
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password
      });

      if (!result.error) {
        displayMessage('Login successful! Redirecting...', 'success');
        // 1️⃣ Find intended redirect, fallback to dashboard
        const redirectTo = searchParams?.get('redirectTo') || '';
        // 2️⃣ Always redirect via middlePage
        const middlePageUrl = `/auth/middlePage?login=true${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
        setTimeout(() => router.replace(middlePageUrl), 1300);
      } else {
        displayMessage('Wrong username or password', 'error');
      }
    } catch (error) {
      displayMessage(`Login error: ${error}`, 'error');
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="flex items-center justify-center w-full mt-20">
      <div className="container-style lg:w-[700px] mx-auto my-12">
        <h1 className="text-4xl font-semibold text-center mb-5 super-decorative-2">
          Login to your dashboard
        </h1>
        <form onSubmit={handleLogin} noValidate>
          <input
            id="username"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* 🗑️ No Remember Me! */}
          <button
            type="submit"
            className="w-full py-2 text-white rounded-lg bg-blue-400 hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
