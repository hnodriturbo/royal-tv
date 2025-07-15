'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAppHandlers from '@/hooks/useAppHandlers';

const LoginPage = () => {
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🟦 Prefill username if coming from signup
  const initialUsername = searchParams?.get('username') || '';
  const isSignup = searchParams?.get('signup') === 'true';

  // 🟩 Local state
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      displayMessage('Please fill in both username and password.', 'info');
      return;
    }

    showLoader({ text: 'Logging in...' });

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
        rememberMe
      });

      if (result?.error) {
        displayMessage('Wrong username or password', 'error');
      } else {
        displayMessage('Login successful! Redirecting...', 'success');
        // 1️⃣ Find redirectTo or fallback to default
        const redirectTo = searchParams?.get('redirectTo') || '';

        // 2️⃣ Pass redirectTo as query to middlePage (so middlePage can use it!)
        const middlePageUrl = `/auth/middlePage?login=true${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
        setTimeout(() => router.replace(middlePageUrl), 2000);
        /* setTimeout(() => router.replace('/auth/middlePage?login=true'), 2000); */
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
            autoFocus // focus for smoother UX
          />
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center mb-4">
            <label htmlFor="rememberMe" className="mr-2">
              Remember Me
            </label>
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2 text-white rounded-lg bg-blue-400 hover:bg-blue-600`}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
