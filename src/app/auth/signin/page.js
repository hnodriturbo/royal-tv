'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAppHandlers from '@/hooks/useAppHandlers';

const LoginPage = () => {
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorOrMessage =
      searchParams?.get('error') || searchParams?.get('message');
    if (errorOrMessage) {
      displayMessage(
        decodeURIComponent(errorOrMessage) || 'An error occurred.',
        'error',
      );
    }
  }, [searchParams, displayMessage]); // Include displayMessage in the dependency array

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
        rememberMe,
      });

      if (result?.error) {
        displayMessage('Wrong username or password', 'error');
      } else {
        displayMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => router.replace('/auth/middlePage?login=true'), 2000);
      }
    } catch (error) {
      displayMessage(`Login error: ${error}`, 'error');
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style pc:w-[700px]">
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
