/**
 * User Profile Page Component
 * ---------------------------
 *
 * Routes & Endpoints:
 *   • GET    /api/user/profile                – fetch current user’s profile data
 *   • PATCH  /api/user/profile                – update name, email, username, contact info, and email-notification setting
 *   • PUT    /api/user/profile/password       – change password by providing oldPassword and newPassword
 *
 * Features:
 *   • Displays editable fields: name, email, username, WhatsApp, Telegram
 *   • Allows selection of preferred contact method (Email / WhatsApp / Telegram)
 *   • Opt-in checkbox for receiving important account emails
 *   • Seamless inline form state (no full-page reloads)
 *   • Toggle between “Edit Profile” and “Change Password” views
 *   • Client-side auth guard via NextAuth + custom useAuthGuard hook (only ‘user’ can access)
 *   • Loader indicators and toast messages during fetch and save operations
 *   • Redirects to a unified middle-page on success, preserving “user” role in query params
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@/hooks/useAppHandlers';
import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

// 📬 contact options
const preferredContactOptions = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' }
];

export default function UserProfile() {
  // 🦁 session + guard
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 👤 profile state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    whatsapp: '',
    telegram: '',
    preferredContactWay: 'email',
    sendEmails: true
  });

  // 🔑 password state
  const [passwordFields, setPasswordFields] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 🔀 toggle view
  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);

  // 🏁 redirect helpers
  const redirectAfterProfileSave = () => {
    router.replace(`/auth/middlePage?update=profile&success=true&role=user`);
  };
  const redirectAfterPasswordSave = () => {
    router.replace(`/auth/middlePage?passwordUpdate=profile&success=true&role=user`);
  };

  // 📦 fetch profile
  const fetchUserProfile = async () => {
    showLoader({ text: 'Fetching your profile...' });
    try {
      const { data } = await axiosInstance.get('/api/user/profile');
      setFormData({
        name: data.name || '',
        email: data.email || '',
        username: data.username || '',
        whatsapp: data.whatsapp || '',
        telegram: data.telegram || '',
        preferredContactWay: data.preferredContactWay || 'email',
        sendEmails: typeof data.sendEmails === 'boolean' ? data.sendEmails : true
      });
    } catch (error) {
      displayMessage(error.response?.data?.error || 'Error fetching profile', 'error');
    } finally {
      hideLoader();
    }
  };

  // 💾 profile submit
  const handleProfileUpdate = async (request) => {
    request.preventDefault(); // 🛑 prevent browser submit
    showLoader({ text: 'Updating profile...' });
    try {
      await axiosInstance.patch('/api/user/profile', { ...formData });
      displayMessage('Profile updated successfully', 'success');
      redirectAfterProfileSave();
    } catch (error) {
      displayMessage(error.response?.data?.error || 'Error updating profile', 'error');
    } finally {
      hideLoader();
    }
  };

  // 🔑 password submit
  const handlePasswordChangeSubmit = async (request) => {
    request.preventDefault(); // 🛑 prevent browser submit
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      displayMessage('New password and confirmation do not match', 'error');
      return;
    }
    showLoader({ text: 'Updating password...' });
    try {
      await axiosInstance.put('/api/user/profile/password', {
        oldPassword: passwordFields.oldPassword,
        newPassword: passwordFields.newPassword
      });
      displayMessage('Password updated successfully', 'success');
      setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordChangeVisible(false);
      redirectAfterPasswordSave();
    } catch (error) {
      displayMessage(error.response?.data?.error || 'Error updating password', 'error');
    } finally {
      hideLoader();
    }
  };

  // ✍️ field change handlers
  const handleFormFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordFields((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // 🚀 effects for auth + fetch
  useEffect(() => {
    if (status === 'authenticated' && isAllowed && session?.user?.user_id) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, session?.user?.user_id]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null; // 🛑 block if not allowed

  return (
    <div className="container-style max-w-full lg:max-w-lg mx-auto min-h-[60vh] rounded-2xl shadow-lg p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        {isPasswordChangeVisible
          ? 'Change Password'
          : session?.user?.name
            ? `${session.user.name} Profile`
            : 'User Profile'}
      </h1>

      {/* 📝 PROFILE FORM */}
      {!isPasswordChangeVisible ? (
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          {/* 👥 user detail fields */}
          {['name', 'email', 'username', 'whatsapp', 'telegram'].map((field) => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium">
                {field.charAt(0).toUpperCase() + field.slice(1)}:
              </label>
              <input
                id={field}
                type={field === 'email' ? 'email' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleFormFieldChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
                autoComplete={field === 'email' ? 'email' : field === 'username' ? 'username' : ''}
              />
            </div>
          ))}

          {/* 📬 preferred contact */}
          <div>
            <label htmlFor="preferredContactWay" className="block text-sm font-medium">
              Preferred Contact Way:
            </label>
            <select
              id="preferredContactWay"
              name="preferredContactWay"
              value={formData.preferredContactWay}
              onChange={handleFormFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
            >
              {preferredContactOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 📧 send emails */}
          <div className="flex items-center gap-2">
            <input
              id="sendEmails"
              name="sendEmails"
              type="checkbox"
              checked={formData.sendEmails}
              onChange={handleFormFieldChange}
              className="h-4 w-4"
            />
            <label htmlFor="sendEmails" className="block text-sm font-medium">
              I want to receive important emails about my account
            </label>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            <button
              type="button"
              onClick={() => setIsPasswordChangeVisible(true)}
              className="btn-info w-1/2"
            >
              Change Password
            </button>
            <button type="submit" className="btn-primary w-1/2">
              Update Profile
            </button>
          </div>
          {/* 🔄 toggle buttons (outside form submit) */}
        </form>
      ) : (
        <form
          onSubmit={handlePasswordChangeSubmit} // 📝 fires only when you click the submit below
          className="space-y-4"
        >
          {/* 🔒 old password */}
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium">
              Old Password:
            </label>
            <input
              id="oldPassword"
              type="password"
              name="oldPassword"
              value={passwordFields.oldPassword}
              onChange={handlePasswordFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
              autoComplete="current-password"
            />
          </div>

          {/* 🔓 new password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium">
              New Password:
            </label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              value={passwordFields.newPassword}
              onChange={handlePasswordFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
              autoComplete="new-password"
            />
          </div>

          {/* 🔁 confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password:
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={passwordFields.confirmPassword}
              onChange={handlePasswordFieldChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
              autoComplete="new-password"
            />
          </div>

          {/* 🚀 Action Buttons: Update & Back */}
          <div className="flex flex-col lg:flex-row items-center gap-3 mt-4 w-full">
            {/* 🚫 does NOT submit */}
            <button
              type="button"
              onClick={() => setIsPasswordChangeVisible(false)}
              className="btn-info w-1/2"
            >
              Back to Profile
            </button>
            {/* ✅ submits the form */}
            <button type="submit" className="btn-primary w-1/2">
              Update Password
            </button>
          </div>
        </form>
      )}

      {/* ↩️ return */}
      <div className="flex items-center justify-center mt-5 w-full">
        <button
          type="button"
          onClick={() => router.push('/user/dashboard')}
          className="btn-secondary w-1/2"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
