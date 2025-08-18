// 📄 File: src/app/auth/reset-password/page.jsx

'use client'; // 🟢 This component runs on the client side

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/language';

export default function ResetPasswordPage() {
  // 🔍 Extract the `token` from the URL query (e.g. ?token=...)
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // 🎛️ Local state for form inputs & status messages
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 📝 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 🚫 Check matching passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 🔗 Send token & new password to your API route
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!res.ok) {
        throw new Error('Failed to reset password.');
      }

      // ✅ On success, show message and redirect after delay
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ If no token is present, show an error immediately
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen">
        <div className="container-style lg:w-[700px] text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid or missing reset token</h1>
          <p>Please request a new password reset link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="container-style lg:w-[700px]">
        {/* 🔒 Page header */}
        <h1 className="text-3xl font-bold mb-6">Reset Your Password</h1>

        {/* ⚠️ Display errors */}
        {error && <p className="text-sm text-red-600 mb-4">❗ {error}</p>}

        {/* ✅ Success message */}
        {success ? (
          <p className="text-sm text-green-600">
            ✔️ Your password has been reset! Redirecting you to sign in...
          </p>
        ) : (
          // 📋 Reset form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                New Password 🔑
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm New Password 🔑
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
